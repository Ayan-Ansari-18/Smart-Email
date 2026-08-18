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
exports.emailWorker = void 0;
exports.processSingleEmail = processSingleEmail;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const db_1 = require("../db");
const aiService_1 = require("../services/aiService");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connection = new ioredis_1.default(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    family: 4,
    tls: {}
});
async function scheduleReminder(userId, refId, refType, targetDate) {
    // Simple scheduling rule: remind 24 hours before
    const reminderTime = new Date(targetDate.getTime() - 24 * 60 * 60 * 1000);
    // Don't schedule if it's already past the reminder time
    if (reminderTime < new Date())
        return;
    const reminder = await db_1.prisma.reminder.create({
        data: {
            userId,
            referenceId: refId,
            referenceType: refType,
            reminderDate: reminderTime,
        }
    });
    // Calculate delay in ms
    const delay = reminderTime.getTime() - Date.now();
    Promise.resolve().then(() => __importStar(require('../queues/reminderQueue'))).then(({ reminderQueue }) => {
        reminderQueue.add('process-reminder', { reminderId: reminder.id }, { delay });
    });
}
async function processSingleEmail(emailId) {
    console.log(`[Worker] Processing email ID: ${emailId}`);
    const email = await db_1.prisma.email.findUnique({
        where: { id: emailId },
    });
    if (!email)
        return;
    if (email.status === 'PROCESSED')
        return;
    const safeDate = (dateStr) => {
        if (!dateStr)
            return null;
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? null : d;
    };
    try {
        const extracted = await (0, aiService_1.extractEntitiesFromEmail)(email.subject, email.sender, email.snippet, email.date);
        // 1. Process Tasks
        if (extracted.tasks && extracted.tasks.length > 0) {
            for (const t of extracted.tasks) {
                const task = await db_1.prisma.task.create({
                    data: {
                        title: t.title,
                        description: t.description || null,
                        dueDate: safeDate(t.dueDate),
                        priority: t.priority || 'Medium',
                        category: t.category || 'Other',
                        userId: email.userId,
                        sourceEmail: email.id,
                    }
                });
                if (task.dueDate) {
                    await scheduleReminder(email.userId, task.id, 'TASK', task.dueDate);
                }
            }
        }
        // 2. Process Events
        if (extracted.events && extracted.events.length > 0) {
            for (const e of extracted.events) {
                const event = await db_1.prisma.event.create({
                    data: {
                        title: e.title,
                        eventDate: safeDate(e.eventDate) || new Date(),
                        eventTime: e.eventTime || null,
                        location: e.location || null,
                        userId: email.userId,
                        sourceEmail: email.id,
                    }
                });
                await scheduleReminder(email.userId, event.id, 'EVENT', event.eventDate);
            }
        }
        // 3. Process Bills
        if (extracted.bills && extracted.bills.length > 0) {
            for (const b of extracted.bills) {
                const bill = await db_1.prisma.bill.create({
                    data: {
                        company: b.company,
                        amount: b.amount ? parseFloat(b.amount) : null,
                        currency: b.currency || null,
                        dueDate: safeDate(b.dueDate),
                        type: b.type || 'Other',
                        userId: email.userId,
                        sourceEmail: email.id,
                    }
                });
                if (bill.dueDate) {
                    await scheduleReminder(email.userId, bill.id, 'BILL', bill.dueDate);
                }
            }
        }
        // Mark email as processed and update spam status
        await db_1.prisma.email.update({
            where: { id: email.id },
            data: {
                status: 'PROCESSED',
                isSpam: extracted.isSpam === true
            },
        });
        // 4. Create Draft Reply if needed
        if (!extracted.isSpam && extracted.needsReply && extracted.suggestedReplyText) {
            await db_1.prisma.draftReply.create({
                data: {
                    emailId: email.id,
                    userId: email.userId,
                    suggestedText: extracted.suggestedReplyText,
                    status: 'PENDING'
                }
            });
        }
        console.log(`[Worker] Successfully processed email ${emailId}`);
    }
    catch (error) {
        console.error(`[Worker] Failed to process email ${emailId}:`, error);
        await db_1.prisma.email.update({
            where: { id: email.id },
            data: { status: 'FAILED' },
        });
        throw error;
    }
}
exports.emailWorker = new bullmq_1.Worker('email-processing', async (job) => {
    await processSingleEmail(job.data.emailId);
}, { connection });
exports.emailWorker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err);
});
