import { Queue } from 'bullmq';
import { connection } from '../redisConfig';

export const reminderQueue = new Queue('reminder-processing', { connection });
