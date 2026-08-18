import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import { generateToken } from './auth';

import './auth'; // Load passport config

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = ['http://localhost:5173'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: Boolean(true)
}));
app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());

import emailRoutes from './routes/emailRoutes';
import taskRoutes from './routes/taskRoutes';
import eventRoutes from './routes/eventRoutes';
import billRoutes from './routes/billRoutes';
import statsRoutes from './routes/statsRoutes';
import draftRoutes from './routes/draftRoutes';
import { authenticateJWT } from './middleware';
import './workers/emailWorker'; // Initialize BullMQ worker
import './workers/reminderWorker'; // Initialize Reminder BullMQ worker
import './workers/summaryWorker'; // Initialize Summary BullMQ cron job

app.use('/api/emails', authenticateJWT, emailRoutes);
app.use('/api/tasks', authenticateJWT, taskRoutes);
app.use('/api/events', authenticateJWT, eventRoutes);
app.use('/api/bills', authenticateJWT, billRoutes);
app.use('/api/stats', authenticateJWT, statsRoutes);
app.use('/api/drafts', authenticateJWT, draftRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// OAuth Routes
app.get('/api/auth/google', passport.authenticate('google', {
  accessType: 'offline',
  prompt: 'consent'
}));

app.get(
  '/api/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: 'http://localhost:5173/login?error=auth_failed' }),
  (req, res) => {
    const user = req.user as any;
    const token = generateToken(user.id);
    // Redirect to frontend to save token in localStorage
    res.redirect(`http://localhost:5173/auth/success?token=${token}`);
  }
);

// Auth check route for frontend
app.get('/api/auth/me', authenticateJWT, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { prisma } = await import('./db');
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, picture: true }
    });
    
    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: dbUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Logout route
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('jwt_token');
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
