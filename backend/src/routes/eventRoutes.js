"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const googleapis_1 = require("googleapis");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const router = express_1.default.Router();
const oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
router.get('/', async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: 'Unauthorized' });
        const events = await db_1.prisma.event.findMany({
            where: { userId: user.userId },
            orderBy: { eventDate: 'asc' },
        });
        res.json(events);
    }
    catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.patch('/:id/confirm', async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: 'Unauthorized' });
        const event = await db_1.prisma.event.updateMany({
            where: { id: req.params.id, userId: user.userId },
            data: { isConfirmed: true },
        });
        if (event.count === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error confirming event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/:id/calendar', async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: 'Unauthorized' });
        const event = await db_1.prisma.event.findUnique({
            where: { id: req.params.id, userId: user.userId },
        });
        if (!event)
            return res.status(404).json({ error: 'Event not found' });
        const account = await db_1.prisma.gmailAccount.findUnique({
            where: { userId: user.userId },
        });
        if (!account)
            return res.status(400).json({ error: 'Gmail account not linked' });
        oauth2Client.setCredentials({
            access_token: account.accessToken,
            refresh_token: account.refreshToken,
            expiry_date: account.tokenExpiry ? account.tokenExpiry.getTime() : null,
        });
        const calendar = googleapis_1.google.calendar({ version: 'v3', auth: oauth2Client });
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
        await db_1.prisma.event.update({
            where: { id: event.id },
            data: { isConfirmed: true },
        });
        res.json({ success: true, eventId: result.data.id });
    }
    catch (error) {
        console.error('Error adding to calendar:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
