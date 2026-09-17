"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const router = express_1.default.Router();
router.get('/', async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: 'Unauthorized' });
        const [emailsCount, tasksCount, eventsCount] = await Promise.all([
            db_1.prisma.email.count({ where: { userId: user.userId } }),
            db_1.prisma.task.count({ where: { userId: user.userId, status: { not: 'COMPLETED' } } }),
            db_1.prisma.event.count({ where: { userId: user.userId, eventDate: { gte: new Date() } } })
        ]);
        res.json({
            emails: emailsCount,
            tasks: tasksCount,
            events: eventsCount
        });
    }
    catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
