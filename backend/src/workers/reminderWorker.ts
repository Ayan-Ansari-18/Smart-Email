import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '../db';
import dotenv from 'dotenv';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL as string, {
  maxRetriesPerRequest: null,
  family: 4,
  tls: {}
});

export const reminderWorker = new Worker(
  'reminder-processing',
  async (job) => {
    const { reminderId } = job.data;
    console.log(`[ReminderWorker] Processing reminder ID: ${reminderId}`);

    const reminder = await prisma.reminder.findUnique({
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
    await prisma.automationLog.create({
      data: {
        userId: reminder.userId,
        action: 'Sent Reminder',
        result: JSON.stringify({ type: reminder.referenceType, id: reminder.referenceId }),
        status: 'SUCCESS'
      }
    });

    // Mark as sent
    await prisma.reminder.update({
      where: { id: reminder.id },
      data: { isSent: true },
    });

    console.log(`[ReminderWorker] Successfully processed reminder ${reminderId}`);
  },
  { connection }
);

reminderWorker.on('failed', (job, err) => {
  console.error(`[ReminderWorker] Job ${job?.id} failed with error:`, err);
});
