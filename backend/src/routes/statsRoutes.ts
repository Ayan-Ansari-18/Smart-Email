import express, { Request } from 'express';
import { prisma } from '../db';

const router = express.Router();

router.get('/', async (req: Request, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const [emailsCount, tasksCount, eventsCount] = await Promise.all([
      prisma.email.count({ where: { userId: user.userId } }),
      prisma.task.count({ where: { userId: user.userId, status: { not: 'COMPLETED' } } }),
      prisma.event.count({ where: { userId: user.userId, eventDate: { gte: new Date() } } })
    ]);

    res.json({
      emails: emailsCount,
      tasks: tasksCount,
      events: eventsCount
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
