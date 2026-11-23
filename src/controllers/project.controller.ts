// src/controllers/project/project.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { projectService } from '@/services/project.service.js';
import { ok } from '@/responses/common/api.response.js';

export const createProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const project = await projectService.createProject(
            req.params.workspaceId as string,
            req.user!.id,
            req.body,
        );
        res.status(201).json(ok(project));
    } catch (e) {
        next(e);
    }
};

export const listProjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const projects = await projectService.listProjects(
            req.params.workspaceId as string,
            req.query as any,
        );
        res.json(ok(projects));
    } catch (e) {
        next(e);
    }
};

export const getProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const project = await projectService.getProject(req.params.projectId as string);
        res.json(ok(project));
    } catch (e) {
        next(e);
    }
};

export const updateProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const project = await projectService.updateProject(req.params.projectId as string, req.body);
        res.json(ok(project));
    } catch (e) {
        next(e);
    }
};

export const archiveProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const project = await projectService.archiveProject(req.params.projectId as string);
        res.json(ok(project));
    } catch (e) {
        next(e);
    }
};

export const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await projectService.deleteProject(req.params.projectId as string);
        res.status(204).send();
    } catch (e) {
        next(e);
    }
};

export const listStatuses = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const statuses = await projectService.listStatuses(req.params.projectId as string);
        res.json(ok(statuses));
    } catch (e) {
        next(e);
    }
};

export const createStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const status = await projectService.createStatus(req.params.projectId as string, req.body);
        res.status(201).json(ok(status));
    } catch (e) {
        next(e);
    }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const status = await projectService.updateStatus(
            req.params.projectId as string,
            req.params.statusId as string,
            req.body,
        );
        res.json(ok(status));
    } catch (e) {
        next(e);
    }
};

export const deleteStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await projectService.deleteStatus(req.params.projectId as string, req.params.statusId as string);
        res.status(204).send("Status deleted successfully");
    } catch (e) {
        next(e);
    }
};