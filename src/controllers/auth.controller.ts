import type { Request, Response, NextFunction } from 'express';
import { authService } from '@/services/auth/auth.service.js';
import { userService } from '@/services/user.service.js';
import { ok } from '@/responses/common/api.response.js';

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await authService.register(req.body);
        res.status(201).json(ok(result));
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        res.json(ok(result));
    } catch (error) {
        next(error);
    }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const refreshToken = req.body.refreshToken;
        const result = await authService.refresh(refreshToken);
        res.json(ok(result));
    } catch (error) {
        next(error);
    }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const refreshToken = req.body.refreshToken;
        await authService.logout(refreshToken);
        res.json(ok(null, { message: 'Logged out successfully' }));
    } catch (error) {
        next(error);
    }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await userService.getUserById(req.user!.id);
        res.json(ok(user));
    } catch (error) {
        next(error);
    }
};