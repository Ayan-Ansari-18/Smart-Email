import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL as string, {
  maxRetriesPerRequest: null,
  family: 4,
  tls: {}
});

export const reminderQueue = new Queue('reminder-processing', { connection });
