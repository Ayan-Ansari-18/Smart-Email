"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const googleapis_1 = require("googleapis");
const genai_1 = require("@google/genai");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const router = (0, express_1.Router)();
const ai = new genai_1.GoogleGenAI({ apiKey: process.env.AI_API_KEY });
// GET all drafts
router.get('/', async (req, res) => {
    try {
        const drafts = await db_1.prisma.draftReply.findMany({
            where: { userId: req.user.userId, status: 'PENDING' },
            include: { email: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json(drafts);
    }
    catch (error) {
        console.error('Error fetching drafts:', error);
        res.status(500).json({ error: 'Failed to fetch drafts' });
    }
});
// POST /:id/regenerate
router.post('/:id/regenerate', async (req, res) => {
    try {
        const { id } = req.params;
        const { feedback } = req.body;
        const draft = await db_1.prisma.draftReply.findUnique({
            where: { id, userId: req.user.userId },
            include: { email: true }
        });
        if (!draft)
            return res.status(404).json({ error: 'Draft not found' });
        const prompt = `
    You are an AI assistant helping a user write an email reply.
    The original email received was:
    Subject: ${draft.email.subject}
    From: ${draft.email.sender}
    Body:
    ${draft.email.snippet}

    You previously drafted this reply:
    ${draft.suggestedText}

    The user provided the following feedback to change the draft:
    "${feedback}"

    Please provide ONLY the raw text of the newly revised email reply. Do not include any JSON wrapping or markdown code blocks. Just the plain text email.
    `;
        const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
        });
        const newText = response.text?.trim() || draft.suggestedText;
        const updatedDraft = await db_1.prisma.draftReply.update({
            where: { id },
            data: { suggestedText: newText, feedback }
        });
        res.json(updatedDraft);
    }
    catch (error) {
        console.error('Error regenerating draft:', error);
        res.status(500).json({ error: 'Failed to regenerate draft' });
    }
});
// POST /:id/approve
router.post('/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        const draft = await db_1.prisma.draftReply.findUnique({
            where: { id, userId: req.user.userId },
            include: { email: true }
        });
        if (!draft)
            return res.status(404).json({ error: 'Draft not found' });
        const account = await db_1.prisma.gmailAccount.findUnique({ where: { userId: req.user.userId } });
        if (!account)
            return res.status(401).json({ error: 'Gmail not connected' });
        const oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
        oauth2Client.setCredentials({ access_token: account.accessToken, refresh_token: account.refreshToken });
        const gmail = googleapis_1.google.gmail({ version: 'v1', auth: oauth2Client });
        // Construct raw email
        const to = draft.email.sender;
        const subject = draft.email.subject.startsWith('Re:') ? draft.email.subject : `Re: ${draft.email.subject}`;
        const message = draft.suggestedText;
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
        const messageParts = [
            `To: ${to}`,
            `Subject: ${utf8Subject}`,
            `In-Reply-To: ${draft.email.messageId}`,
            `References: ${draft.email.messageId}`,
            'Content-Type: text/plain; charset=utf-8',
            '',
            message
        ];
        const messageRaw = messageParts.join('\n');
        const encodedMessage = Buffer.from(messageRaw)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
            }
        });
        await db_1.prisma.draftReply.update({
            where: { id },
            data: { status: 'SENT' }
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});
// POST /:id/reject
router.post('/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.prisma.draftReply.update({
            where: { id, userId: req.user.userId },
            data: { status: 'REJECTED' }
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error rejecting draft:', error);
        res.status(500).json({ error: 'Failed to reject draft' });
    }
});
exports.default = router;
