"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncEmailsForUser = void 0;
const googleapis_1 = require("googleapis");
const db_1 = require("./db");
const dotenv_1 = __importDefault(require("dotenv"));
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
const syncEmailsForUser = async (userId) => {
    const account = await db_1.prisma.gmailAccount.findUnique({
        where: { userId },
    });
    if (!account) {
        throw new Error('Gmail account not connected');
    }
    oauth2Client.setCredentials({
        access_token: account.accessToken,
        refresh_token: account.refreshToken,
        expiry_date: account.tokenExpiry ? account.tokenExpiry.getTime() : null,
    });
    // Handle token refresh automatically by googleapis if refresh_token is present
    oauth2Client.on('tokens', async (tokens) => {
        if (tokens.access_token) {
            await db_1.prisma.gmailAccount.update({
                where: { userId },
                data: {
                    accessToken: tokens.access_token,
                    ...(tokens.refresh_token && { refreshToken: tokens.refresh_token }),
                    tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                },
            });
        }
    });
    const gmail = googleapis_1.google.gmail({ version: 'v1', auth: oauth2Client });
    // Fetch up to 100,000 emails using pagination (max 500 per page)
    const MAX_EMAILS = 100000;
    const allMessages = [];
    let pageToken = undefined;
    do {
        const listResponse = await gmail.users.messages.list({
            userId: 'me',
            maxResults: 500,
            pageToken: pageToken,
        });
        if (listResponse.data.messages) {
            allMessages.push(...listResponse.data.messages);
        }
        pageToken = listResponse.data.nextPageToken || undefined;
    } while (pageToken && allMessages.length < MAX_EMAILS);
    // Cap to MAX_EMAILS just in case the last page pushed us over
    const messages = allMessages.slice(0, MAX_EMAILS);
    for (const message of messages) {
        if (!message.id)
            continue;
        const existingEmail = await db_1.prisma.email.findUnique({
            where: { messageId: message.id },
        });
        if (existingEmail) {
            if (existingEmail.status === 'PENDING') {
                // Re-process stuck emails
                Promise.resolve().then(() => __importStar(require('./workers/emailWorker'))).then(({ processSingleEmail }) => {
                    processSingleEmail(existingEmail.id).catch(err => console.error("Failed to process existing email inline", err));
                }).catch(err => console.error("Failed to load worker", err));
            }
            continue; // Skip if already PROCESSED or after triggering re-process
        }
        // Fetch full message details
        try {
            const msgData = await gmail.users.messages.get({
                userId: 'me',
                id: message.id,
                format: 'metadata',
                metadataHeaders: ['Subject', 'From', 'Date'],
            });
            const headers = msgData.data.payload?.headers || [];
            const subject = headers.find((h) => h.name === 'Subject')?.value || 'No Subject';
            const sender = headers.find((h) => h.name === 'From')?.value || 'Unknown Sender';
            const dateStr = headers.find((h) => h.name === 'Date')?.value;
            const date = dateStr ? new Date(dateStr) : new Date();
            const snippet = msgData.data.snippet || '';
            // Save to database
            await db_1.prisma.email.create({
                data: {
                    messageId: message.id,
                    userId: userId,
                    sender,
                    subject,
                    snippet,
                    date,
                    status: 'PENDING',
                },
            });
        }
        catch (err) {
            if (err.code === 'P2002') {
                // Silently ignore if the email was inserted concurrently
            }
            else {
                console.error(`Failed to fetch or save email ${message.id}:`, err);
            }
        }
    }
    // Trigger sequential processing in background so it doesn't crash the API
    const scriptPath = path_1.default.join(__dirname, '../../process_pending.ts');
    const child = (0, child_process_1.spawn)('npx', ['tsx', scriptPath], {
        detached: true,
        stdio: 'ignore',
        shell: true
    });
    child.unref();
    // Update last sync time
    await db_1.prisma.gmailAccount.update({
        where: { userId },
        data: { lastSync: new Date() },
    });
    return { success: true, count: messages.length };
};
exports.syncEmailsForUser = syncEmailsForUser;
