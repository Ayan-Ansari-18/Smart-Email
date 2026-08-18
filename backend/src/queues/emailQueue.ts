import { Queue } from 'bullmq';
import { connection } from '../redisConfig';

export const emailQueue = new Queue('email-processing', { connection });
