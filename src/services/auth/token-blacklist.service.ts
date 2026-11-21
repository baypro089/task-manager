// src/services/auth/token-blacklist.service.ts
import { redis } from '@/configuration/redis.js';

const BLACKLIST_PREFIX = 'blacklist:';

export class TokenBlacklistService {
  /**
   * Blacklist một jti với TTL bằng thời gian còn lại của token.
   * Redis sẽ tự xóa key khi token hết hạn → không cần cleanup thủ công.
   */
  async blacklist(jti: string, expiresInSeconds: number): Promise<void> {
    await redis.setEx(`${BLACKLIST_PREFIX}${jti}`, expiresInSeconds, '1');
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    const result = await redis.get(`${BLACKLIST_PREFIX}${jti}`);
    return result !== null;
  }
}

export const tokenBlacklistService = new TokenBlacklistService();