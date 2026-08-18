import express, { Request } from 'express';
import { prisma } from '../db';
import { syncEmailsForUser } from '../gmailService';

const router = express.Router();

// Sync recent emails from Gmail
router.post('/sync', async (req: Request, res) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Run in background to prevent HTTP timeouts for large mailboxes
    syncEmailsForUser(userId).catch(console.error);
    res.json({ success: true, message: 'Sync started in background. Emails will appear shortly.' });
  } catch (error: any) {
    console.error('Email sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all emails from DB
router.get('/', async (req: Request, res) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const emails = await prisma.email.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 50,
    });
    res.json(emails);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single email
router.get('/:id', async (req: Request, res) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const email = await prisma.email.findFirst({
      where: { id: req.params.id as string, userId },
    });
    
    if (!email) return res.status(404).json({ error: 'Email not found' });
    res.json(email);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
