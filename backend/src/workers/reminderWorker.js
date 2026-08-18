"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reminderWorker = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const db_1 = require("../db");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connection = new ioredis_1.default(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    family: 4,
    tls: {}
});
exports.reminderWorker = new bullmq_1.Worker('reminder-processing', async (job) => {
    const { reminderId } = job.data;
    console.log(`[ReminderWorker] Processing reminder ID: ${reminderId}`);
    const reminder = await db_1.prisma.reminder.findUnique({
        where: { id: reminderId },
    });
    if (!reminder) {
        console.error(`[ReminderWorker] Reminder not found in DB: ${reminderId}`);
        return;
    }
    if (reminder.isSent) {
        console.log(`[ReminderWorker] Reminder already sent: ${reminderId}`);
        return;
    }
    // In a real app, you would send a Push Notification, Email, or SMS here.
    // For MVP, we will just log it and mark it as sent in DB.
    console.log(`[ReminderWorker] 🚨 NOTIFICATION ALERT for ${reminder.referenceType} (ID: ${reminder.referenceId})`);
    // Log the automation action
    await db_1.prisma.automationLog.create({
        data: {
            userId: reminder.userId,
            action: 'Sent Reminder',
            result: JSON.stringify({ type: reminder.referenceType, id: reminder.referenceId }),
            status: 'SUCCESS'
        }
    });
    // Mark as sent
    await db_1.prisma.reminder.update({
        where: { id: reminder.id },
        data: { isSent: true },
    });
    console.log(`[ReminderWorker] Successfully processed reminder ${reminderId}`);
}, { connection });
exports.reminderWorker.on('failed', (job, err) => {
    console.error(`[ReminderWorker] Job ${job?.id} failed with error:`, err);
});
