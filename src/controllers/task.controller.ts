import type { Request, Response, NextFunction } from 'express';
import { taskService } from '@/services/task.service.js';
import { ok } from '@/responses/common/api.response.js';

export const createTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const task = await taskService.createTask(
            req.params.projectId as string,
            req.user!.id,
            req.body,
        );
        res.status(201).json(ok(task));
    } catch (e) {
        next(e);
    }
};

export const getBoard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const board = await taskService.getBoard(req.params.projectId as string);
        res.json(ok(board));
    } catch (e) {
        next(e);
    }
};

export const listTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tasks = await taskService.listTasks(req.params.projectId as string, req.query as any);
        res.json(ok(tasks));
    } catch (e) {
        next(e);
    }
};

export const getTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const task = await taskService.getTask(req.params.taskId as string);
        res.json(ok(task));
    } catch (e) {
        next(e);
    }
};

export const updateTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const task = await taskService.updateTask(req.params.taskId as string, req.user!.id, req.body);
        res.json(ok(task));
    } catch (e) {
        next(e);
    }
};

export const moveTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const task = await taskService.moveTask(
            req.params.taskId as string,
            req.params.projectId as string,
            req.user!.id,
            req.body,
        );
        res.json(ok(task));
    } catch (e) {
        next(e);
    }
};

export const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await taskService.deleteTask(req.params.taskId as string, req.user!.id);
        res.status(204).send("Deleted successfully");
    } catch (e) {
        next(e);
    }
};