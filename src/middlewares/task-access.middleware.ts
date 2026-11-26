import type { Request, Response, NextFunction } from 'express';
import { taskRepository, projectRepository, workspaceRepository } from '../repositories/index.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

export const requireTaskAccess = () =>
    async (req: Request, _res: Response, next: NextFunction) => {
        try {
            const taskId = req.params.taskId;
            if (!taskId) throw new BadRequestError('taskId is required');

            const task = await taskRepository.findById(taskId as string);
            if (!task) throw new NotFoundError('Task not found');

            // 🆕 Lookup project từ task.projectId để lấy workspaceId
            const project = await projectRepository.findById(task.projectId);
            if (!project) throw new NotFoundError('Task not found');

            const member = await workspaceRepository.findMember(project.workspaceId, req.user!.id);
            if (!member) throw new NotFoundError('Task not found');

            req.task = task;
            req.project = project;             
            req.workspaceMember = member;
            next();
        } catch (e) {
            next(e);
        }
    };