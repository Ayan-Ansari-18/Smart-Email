import { Worker } from 'bullmq';
import { connection } from '../redisConfig';

async function scheduleReminder(userId: string, refId: string, refType: string, targetDate: Date) {
  // Simple scheduling rule: remind 24 hours before
  const reminderTime = new Date(targetDate.getTime() - 24 * 60 * 60 * 1000);
  
  // Don't schedule if it's already past the reminder time
  if (reminderTime < new Date()) return;

  const reminder = await prisma.reminder.create({
    data: {
      userId,
      referenceId: refId,
      referenceType: refType,
      reminderDate: reminderTime,
    }
  });

  // Calculate delay in ms
  const delay = reminderTime.getTime() - Date.now();
  
  import('../queues/reminderQueue').then(({ reminderQueue }) => {
    reminderQueue.add('process-reminder', { reminderId: reminder.id }, { delay });
  });
}
export async function processSingleEmail(emailId: string) {
  console.log(`[Worker] Processing email ID: ${emailId}`);

  const email = await prisma.email.findUnique({
    where: { id: emailId },
  });

  if (!email) return;
  if (email.status === 'PROCESSED') return;

  const safeDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  try {
    const extracted = await extractEntitiesFromEmail(
      email.subject,
      email.sender,
      email.snippet, 
      email.date
    );

    // 1. Process Tasks
    if (extracted.tasks && extracted.tasks.length > 0) {
      for (const t of extracted.tasks) {
        const task = await prisma.task.create({
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
        const event = await prisma.event.create({
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
        const bill = await prisma.bill.create({
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
    await prisma.email.update({
      where: { id: email.id },
      data: { 
        status: 'PROCESSED',
        isSpam: extracted.isSpam === true
      },
    });

    // 4. Create Draft Reply if needed
    if (!extracted.isSpam && extracted.needsReply && extracted.suggestedReplyText) {
      await prisma.draftReply.create({
        data: {
          emailId: email.id,
          userId: email.userId,
          suggestedText: extracted.suggestedReplyText,
          status: 'PENDING'
        }
      });
    }

    console.log(`[Worker] Successfully processed email ${emailId}`);
  } catch (error) {
    console.error(`[Worker] Failed to process email ${emailId}:`, error);
    await prisma.email.update({
      where: { id: email.id },
      data: { status: 'FAILED' },
    });
    throw error;
  }
}

export const emailWorker = new Worker(
  'email-processing',
  async (job) => {
    await processSingleEmail(job.data.emailId);
  },
  { connection }
);

emailWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err);
});
