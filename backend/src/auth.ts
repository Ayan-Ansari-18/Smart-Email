import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from './db';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_REDIRECT_URI!,
      scope: [
        'profile',
        'email',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/calendar.events'
      ],
    },
    async (accessToken: any, refreshToken: any, profile: any, done: any) => {
      try {
        const email = profile.emails?.[0].value;
        if (!email) {
          return done(new Error('No email found from Google'));
        }

        // Upsert user
        const user = await prisma.user.upsert({
          where: { email },
          update: {
            name: profile.displayName,
            picture: profile.photos?.[0].value,
          },
          create: {
            email,
            name: profile.displayName,
            picture: profile.photos?.[0].value,
            settings: {
              create: {} // Create default settings
            }
          },
        });

        // Upsert Gmail account
        await prisma.gmailAccount.upsert({
          where: { userId: user.id },
          update: {
            accessToken,
            ...(refreshToken && { refreshToken }), // Only update if provided
            tokenExpiry: new Date(Date.now() + 3600 * 1000), // Approx 1 hour expiry
          },
          create: {
            userId: user.id,
            accessToken,
            refreshToken: refreshToken || '', // Ensure it is set initially
            tokenExpiry: new Date(Date.now() + 3600 * 1000),
          },
        });

        // Trigger background sync immediately so the user doesn't have to wait
        import('./gmailService').then(({ syncEmailsForUser }) => {
          syncEmailsForUser(user.id).catch(console.error);
        });

        done(null, user);
      } catch (error) {
        done(error);
      }
    }
  )
);

export const generateToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET) as { userId: string };
};
