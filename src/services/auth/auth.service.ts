// src/services/auth/auth.service.ts (phần bổ sung)
import { refreshTokenService } from './refresh-token.service.js';
import { tokenBlacklistService } from './token-blacklist.service.js';
import { signAccessToken, signRefreshToken, verifyToken } from '../../utils/jwt.js';
import { comparePassword, hashPassword } from '@/utils/password.js';
import { userRepository } from '@/repositories/index.js';
import type { RegisterDto } from '@/dtos/register.dto.js';
import { BadRequestError, UnauthorizedError } from '@/utils/errors.js';

export class AuthService {

    /**
     * 
     * @param email 
     * @param password 
     * @returns 
     * Đăng nhập
     */
    async login(email: string, password: string) {
        const user = await userRepository.findByEmail(email);
        if (!user) throw new UnauthorizedError('Invalid credentials');

        const valid = await comparePassword(password, user.passwordHash);
        if (!valid) throw new UnauthorizedError('Invalid credentials');

        const accessToken = signAccessToken(user.id);
        const refreshToken = signRefreshToken(user.id);

        // Lưu refresh token jti vào Redis
        const payload = verifyToken(refreshToken);
        await refreshTokenService.store(user.id, payload.jti);

        return {
            user: { id: user.id, email: user.email, displayName: user.displayName },
            accessToken,
            refreshToken,
        };
    }

    /**
     * Đăng ký: 
     */
    async register(dto: RegisterDto){
        const existingUser = await userRepository.findByEmail(dto.email);
        if (existingUser) throw new Error('Email already in use');

        const user = await userRepository.create({
            email: dto.email,
            passwordHash: await hashPassword(dto.password),
            displayName: dto.displayName,
        });

        const accessToken = signAccessToken(user.id);
        const refreshToken = signRefreshToken(user.id);

        // Lưu refresh token jti vào Redis
        const payload = verifyToken(refreshToken);
        await refreshTokenService.store(user.id, payload.jti);

        return {
            user: { id: user.id, email: user.email, displayName: user.displayName },
            accessToken,
            refreshToken,
        };
    }

    /**
     * Refresh: đổi refresh token cũ lấy cặp token mới.
     * Nếu refresh token cũ không tồn tại trong Redis → có thể bị đánh cắp → revoke all.
     */
    async refresh(refreshToken: string) {
        let payload;
        try {
            payload = verifyToken(refreshToken);
        } catch {
            throw new Error('Invalid refresh token');
        }

        if (payload.type !== 'refresh') throw new Error('Invalid token type');

        const storedUserId = await refreshTokenService.verify(payload.jti);
        if (!storedUserId) {
            // Token không tồn tại → có thể đã bị rotation hoặc bị đánh cắp
            // Revoke toàn bộ session của user này để an toàn
            await refreshTokenService.revokeAll(payload.sub);
            throw new Error('Refresh token reuse detected. All sessions revoked.');
        }

        // Rotation: xóa token cũ, cấp token mới
        await refreshTokenService.revoke(payload.jti);

        const newAccessToken = signAccessToken(payload.sub);
        const newRefreshToken = signRefreshToken(payload.sub);
        const newPayload = verifyToken(newRefreshToken);
        await refreshTokenService.store(payload.sub, newPayload.jti);

        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    }

    /**
     * Logout: blacklist access token hiện tại + revoke refresh token.
     */
    async logout(accessToken: string, refreshToken?: string) {
        // Blacklist access token
        const payload = verifyToken(accessToken);
        const expiresIn = (payload as any).exp - Math.floor(Date.now() / 1000);
        if (expiresIn > 0) {
            await tokenBlacklistService.blacklist(payload.jti, expiresIn);
        }

        // Revoke refresh token nếu có
        if (refreshToken) {
            try {
                const refreshPayload = verifyToken(refreshToken);
                await refreshTokenService.revoke(refreshPayload.jti);
            } catch {
                // Refresh token đã hết hạn hoặc invalid → bỏ qua
            }
        }
    }
}

export const authService = new AuthService();