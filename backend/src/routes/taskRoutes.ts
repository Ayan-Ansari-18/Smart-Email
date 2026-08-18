import express, { Request } from 'express';
import { prisma } from '../db';

const router = express.Router();

// Get all tasks for the logged in user
router.get('/', async (req: Request, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const tasks = await prisma.task.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
    });

    // Map sourceEmail (UUID) to Gmail messageId
    const emailIds = tasks.map(t => t.sourceEmail).filter(Boolean) as string[];
    const emails = await prisma.email.findMany({
      where: { id: { in: emailIds } },
      select: { id: true, messageId: true }
    });
    
    const emailMap = Object.fromEntries(emails.map(e => [e.id, e.messageId]));
    const tasksWithEmails = tasks.map(t => ({
      ...t,
      messageId: t.sourceEmail && emailMap[t.sourceEmail] ? emailMap[t.sourceEmail] : null
    }));

    res.json(tasksWithEmails);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update task status
router.patch('/:id', async (req: Request, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { status } = req.body;

    const task = await prisma.task.updateMany({
      where: { id: req.params.id as string, userId: user.userId },
      data: { status },
    });

    if (task.count === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
