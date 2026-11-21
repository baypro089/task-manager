import { redis } from '@/configuration/redis.js';

export class CacheService {
  /**
   * Cache-aside: đọc từ cache trước, nếu miss → gọi fetchFn → set cache
   */
  async getOrSet<T>(key: string, ttl: number, fetchFn: () => Promise<T>): Promise<T> {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }

    const fresh = await fetchFn();
    await redis.setEx(key, ttl, JSON.stringify(fresh));
    return fresh;
  }

  async get<T>(key: string): Promise<T | null> {
    const cached = await redis.get(key);
    return cached ? (JSON.parse(cached) as T) : null;
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    await redis.setEx(key, ttl, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await redis.del(key);
  }

  /**
   * Tăng version key → vô hiệu hóa TOÀN BỘ cache list cũ (không cần SCAN)
   */
  async bumpVersion(versionKey: string): Promise<number> {
    return redis.incr(versionKey);
  }

  async getVersion(versionKey: string): Promise<number> {
    const v = await redis.get(versionKey);
    return v ? Number(v) : 0;
  }
}

export const cacheService = new CacheService();