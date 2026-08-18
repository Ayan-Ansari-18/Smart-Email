import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || process.env.REDIS_URI;

if (!redisUrl) {
  console.error('[Redis] ERROR: No REDIS_URL or REDIS_URI provided in environment variables!');
}

// Create a single shared Redis connection for all queues and workers
export const connection = new IORedis(redisUrl as string, {
  maxRetriesPerRequest: null,
  family: 0
});

connection.on('error', (err) => {
  console.error('[Redis Error]', err);
});

connection.on('connect', () => {
  console.log('[Redis] Connected successfully');
});
