"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const router = express_1.default.Router();
// Get all tasks for the logged in user
router.get('/', async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: 'Unauthorized' });
        const tasks = await db_1.prisma.task.findMany({
            where: { userId: user.userId },
            orderBy: { createdAt: 'desc' },
        });
        // Map sourceEmail (UUID) to Gmail messageId
        const emailIds = tasks.map(t => t.sourceEmail).filter(Boolean);
        const emails = await db_1.prisma.email.findMany({
            where: { id: { in: emailIds } },
            select: { id: true, messageId: true }
        });
        const emailMap = Object.fromEntries(emails.map(e => [e.id, e.messageId]));
        const tasksWithEmails = tasks.map(t => ({
            ...t,
            messageId: t.sourceEmail && emailMap[t.sourceEmail] ? emailMap[t.sourceEmail] : null
        }));
        res.json(tasksWithEmails);
    }
    catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update task status
router.patch('/:id', async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { status } = req.body;
        const task = await db_1.prisma.task.updateMany({
            where: { id: req.params.id, userId: user.userId },
            data: { status },
        });
        if (task.count === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
