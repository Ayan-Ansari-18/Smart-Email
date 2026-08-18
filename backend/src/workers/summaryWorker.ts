import { Worker, Queue } from 'bullmq';
import { prisma } from '../db';
import { startOfDay, endOfDay } from 'date-fns';
import { connection } from '../redisConfig';
import { sendEmail } from '../gmailService';

export const summaryQueue = new Queue('daily-summary', { connection });

// summaryQueue.add('generate-daily-summary', {}, {
//   repeat: {
//     pattern: '0 8 * * *', // 8 AM every day
//   }
// });

export const summaryWorker = new Worker(
  'daily-summary',
  async (job) => {
    console.log(`[SummaryWorker] Generating daily summaries...`);

    const users = await prisma.user.findMany({
      include: { settings: true }
    });

    for (const user of users) {
      if (user.settings && !user.settings.dailySummary) {
        continue;
      }

      const todayStart = startOfDay(new Date());
      const todayEnd = endOfDay(new Date());

      // Fetch what's due today
      const tasksDue = await prisma.task.findMany({
        where: { userId: user.id, dueDate: { gte: todayStart, lte: todayEnd }, status: { not: 'COMPLETED' } }
      });

      const eventsToday = await prisma.event.findMany({
        where: { userId: user.id, eventDate: { gte: todayStart, lte: todayEnd } }
      });

      const billsDue = await prisma.bill.findMany({
        where: { userId: user.id, dueDate: { gte: todayStart, lte: todayEnd } }
      });

      // In a real application, you would compile these into a nice HTML email and send it via SendGrid or AWS SES
      if (tasksDue.length > 0 || eventsToday.length > 0 || billsDue.length > 0) {
        console.log(`[SummaryWorker] 📅 Daily Summary for User ${user.email}:`);
        console.log(`  - ${tasksDue.length} Tasks Due`);
        console.log(`  - ${eventsToday.length} Events Today`);
        console.log(`  - ${billsDue.length} Bills Due`);
        
        await prisma.automationLog.create({
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
  },
  { connection }
);

summaryWorker.on('failed', (job, err) => {
  console.error(`[SummaryWorker] Job failed with error:`, err);
});
