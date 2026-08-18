"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.summaryWorker = exports.summaryQueue = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const db_1 = require("../db");
const dotenv_1 = __importDefault(require("dotenv"));
const date_fns_1 = require("date-fns");
dotenv_1.default.config();
const connection = new ioredis_1.default(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    family: 4,
    tls: {}
});
exports.summaryQueue = new bullmq_1.Queue('daily-summary', { connection });
// summaryQueue.add('generate-daily-summary', {}, {
//   repeat: {
//     pattern: '0 8 * * *', // 8 AM every day
//   }
// });
exports.summaryWorker = new bullmq_1.Worker('daily-summary', async (job) => {
    console.log(`[SummaryWorker] Generating daily summaries...`);
    const users = await db_1.prisma.user.findMany({
        include: { settings: true }
    });
    for (const user of users) {
        if (user.settings && !user.settings.dailySummary) {
            continue;
        }
        const todayStart = (0, date_fns_1.startOfDay)(new Date());
        const todayEnd = (0, date_fns_1.endOfDay)(new Date());
        // Fetch what's due today
        const tasksDue = await db_1.prisma.task.findMany({
            where: { userId: user.id, dueDate: { gte: todayStart, lte: todayEnd }, status: { not: 'COMPLETED' } }
        });
        const eventsToday = await db_1.prisma.event.findMany({
            where: { userId: user.id, eventDate: { gte: todayStart, lte: todayEnd } }
        });
        const billsDue = await db_1.prisma.bill.findMany({
            where: { userId: user.id, dueDate: { gte: todayStart, lte: todayEnd } }
        });
        // In a real application, you would compile these into a nice HTML email and send it via SendGrid or AWS SES
        if (tasksDue.length > 0 || eventsToday.length > 0 || billsDue.length > 0) {
            console.log(`[SummaryWorker] 📅 Daily Summary for User ${user.email}:`);
            console.log(`  - ${tasksDue.length} Tasks Due`);
            console.log(`  - ${eventsToday.length} Events Today`);
            console.log(`  - ${billsDue.length} Bills Due`);
            await db_1.prisma.automationLog.create({
                data: {
                    userId: user.id,
                    action: 'Sent Daily Summary',
                    result: JSON.stringify({ tasks: tasksDue.length, events: eventsToday.length, bills: billsDue.length }),
                    status: 'SUCCESS'
                }
            });
        }
    }
    console.log(`[SummaryWorker] Finished generating daily summaries.`);
}, { connection });
exports.summaryWorker.on('failed', (job, err) => {
    console.error(`[SummaryWorker] Job failed with error:`, err);
});
