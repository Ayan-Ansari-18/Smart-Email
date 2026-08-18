import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Create a single shared Redis connection for all queues and workers
export const connection = new IORedis(process.env.REDIS_URL as string, {
  maxRetriesPerRequest: null,
  tls: { rejectUnauthorized: false }
});
