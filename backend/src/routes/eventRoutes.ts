import express, { Request } from 'express';
import { prisma } from '../db';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

router.get('/', async (req: Request, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const events = await prisma.event.findMany({
      where: { userId: user.userId },
      orderBy: { eventDate: 'asc' },
    });

    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/confirm', async (req: Request, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const event = await prisma.event.updateMany({
      where: { id: req.params.id as string, userId: user.userId },
      data: { isConfirmed: true },
    });

    if (event.count === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error confirming event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/calendar', async (req: Request, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const event = await prisma.event.findUnique({
      where: { id: req.params.id as string, userId: user.userId },
    });

    if (!event) return res.status(404).json({ error: 'Event not found' });

    const account = await prisma.gmailAccount.findUnique({
      where: { userId: user.userId },
    });

    if (!account) return res.status(400).json({ error: 'Gmail account not linked' });

    oauth2Client.setCredentials({
      access_token: account.accessToken,
      refresh_token: account.refreshToken,
      expiry_date: account.tokenExpiry ? account.tokenExpiry.getTime() : null,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Calculate end time (assume 1 hour duration)
    const startDate = new Date(event.eventDate);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const result = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: event.title,
        location: event.location || '',
        start: { dateTime: startDate.toISOString(), timeZone: 'UTC' },
        end: { dateTime: endDate.toISOString(), timeZone: 'UTC' },
      },
    });

    // Mark as confirmed and saved to calendar
    await prisma.event.update({
      where: { id: event.id },
      data: { isConfirmed: true },
    });

    res.json({ success: true, eventId: result.data.id });
  } catch (error) {
    console.error('Error adding to calendar:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
