"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const gmailService_1 = require("../gmailService");
const router = express_1.default.Router();
// Sync recent emails from Gmail
router.post('/sync', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        // Run in background to prevent HTTP timeouts for large mailboxes
        (0, gmailService_1.syncEmailsForUser)(userId).catch(console.error);
        res.json({ success: true, message: 'Sync started in background. Emails will appear shortly.' });
    }
    catch (error) {
        console.error('Email sync error:', error);
        res.status(500).json({ error: error.message });
    }
});
// Get all emails from DB
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const emails = await db_1.prisma.email.findMany({
            where: { userId },
            orderBy: { date: 'desc' },
            take: 50,
        });
        res.json(emails);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get single email
router.get('/:id', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const email = await db_1.prisma.email.findFirst({
            where: { id: req.params.id, userId },
        });
        if (!email)
            return res.status(404).json({ error: 'Email not found' });
        res.json(email);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
