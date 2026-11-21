// src/config/redis.ts
import { createClient } from 'redis';
import { env } from './env.js';

export const redis = createClient({
  url: env.REDIS_URL, // redis://localhost:6379
});

redis.on('error', (err) => {
  console.error('❌ Redis Client Error:', err);
});

// Kết nối một lần khi module được load
await redis.connect();
console.log('✅ Redis connected');