// src/services/auth/refresh-token.service.ts
import { redis } from '@/configuration/redis.js';

const REFRESH_PREFIX = 'refresh:';
const USER_REFRESH_SET = 'user_refresh:';

export class RefreshTokenService {
  /**
   * Lưu refresh token jti vào Redis, gắn với userId.
   * TTL = 7 ngày (khớp với thời hạn refresh token).
   */
  async store(userId: string, jti: string): Promise<void> {
    const ttl = 7 * 24 * 60 * 60; // 7 ngày
    await redis.setEx(`${REFRESH_PREFIX}${jti}`, ttl, userId);
    // Thêm jti vào set của user để có thể revoke tất cả
    await redis.sAdd(`${USER_REFRESH_SET}${userId}`, jti);
    await redis.expire(`${USER_REFRESH_SET}${userId}`, ttl);
  }

  /**
   * Kiểm tra refresh token còn hợp lệ không.
   * Trả về userId nếu hợp lệ, null nếu không.
   */
  async verify(jti: string): Promise<string | null> {
    return redis.get(`${REFRESH_PREFIX}${jti}`);
  }

  /**
   * Xóa một refresh token (dùng khi rotation hoặc logout).
   */
  async revoke(jti: string): Promise<void> {
    await redis.del(`${REFRESH_PREFIX}${jti}`);
  }

  /**
   * Revoke tất cả refresh token của một user (dùng khi phát hiện token bị đánh cắp).
   */
  async revokeAll(userId: string): Promise<void> {
    const jtis = await redis.sMembers(`${USER_REFRESH_SET}${userId}`);
    if (jtis.length > 0) {
      await redis.del(jtis.map((jti) => `${REFRESH_PREFIX}${jti}`));
    }
    await redis.del(`${USER_REFRESH_SET}${userId}`);
  }
}

export const refreshTokenService = new RefreshTokenService();