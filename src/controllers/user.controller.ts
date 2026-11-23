// src/controllers/user/user.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { userService } from '@/services/user.service.js';
import { ok } from '@/responses/common/api.response.js';

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await userService.getUserById(req.params.id as string);
        res.json(ok(user));
    } catch (error) {
        next(error);
    }
};

export const listUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await userService.getAllUsersWithPage(req.query as any);
        res.json(ok(users));
    } catch (error) {
        next(error);
    }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await userService.updateUser(req.params.id as string, req.body);
        res.json(ok(user));
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await userService.deleteUser(req.params.id as string);
        res.status(204).send("User deleted successfully");
    } catch (error) {
        next(error);
    }
};