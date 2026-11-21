// src/controllers/user/user.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { userService } from '@/services/user.service.js';

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await userService.getUserById(req.params.id as string);
        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

export const listUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await userService.getAllUsersWithPage(req.query as any);
        res.json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await userService.updateUser(req.params.id as string, req.body);
        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await userService.deleteUser(req.params.id as string);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};