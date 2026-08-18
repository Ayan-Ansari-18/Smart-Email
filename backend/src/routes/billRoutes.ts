import express, { Request } from 'express';
import { prisma } from '../db';

const router = express.Router();

router.get('/', async (req: Request, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const bills = await prisma.bill.findMany({
      where: { userId: user.userId },
      orderBy: { dueDate: 'asc' },
    });

    res.json(bills);
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
