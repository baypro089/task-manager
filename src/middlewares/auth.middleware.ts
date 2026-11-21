// src/middlewares/auth.middleware.ts
import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { tokenBlacklistService } from '../services/auth/token-blacklist.service.js';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }

    try {
        const payload = verifyToken(header.slice(7));
        if (payload.type !== 'access') {
            res.status(401).json({ success: false, message: 'Invalid token type' });
            return;
        }

        // Kiểm tra blacklist
        if (await tokenBlacklistService.isBlacklisted(payload.jti)) {
            res.status(401).json({ success: false, message: 'Token revoked' });
            return;
        }

        (req as Request & { user: { id: string } }).user = { id: payload.sub };
        next();
    } catch {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};