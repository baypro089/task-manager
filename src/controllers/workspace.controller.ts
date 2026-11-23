import type { Request, Response, NextFunction } from 'express';
import { workspaceService } from '@/services/workspace.service.js';
import { ok } from '@/responses/common/api.response.js';

export const createWorkspace = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const ws = await workspaceService.createWorkspace(req.user!.id, req.body);
        res.status(201).json(ok(ws));
    } catch (e) {
        next(e);
    }
};

export const listMyWorkspaces = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const list = await workspaceService.listMyWorkspaces(req.user!.id);
        res.json(ok(list, { total: list.length }));
    } catch (e) {
        next(e);
    }
};

export const getWorkspace = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const ws = await workspaceService.getWorkspaceById(req.params.workspaceId as string, req.user!.id);
        res.json(ok(ws));
    } catch (e) {
        next(e);
    }
};

export const updateWorkspace = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const ws = await workspaceService.updateWorkspace(req.params.workspaceId as string, req.body);
        res.json(ok(ws));
    } catch (e) {
        next(e);
    }
};

export const deleteWorkspace = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await workspaceService.deleteWorkspace(req.params.workspaceId as string, req.user!.id);
        res.status(204).send();
    } catch (e) {
        next(e);
    }
};

export const listMembers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const members = await workspaceService.listMembers(req.params.workspaceId as string, req.user!.id);
        res.json(ok(members, { total: members.length }));
    } catch (e) {
        next(e);
    }
};

export const inviteMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const member = await workspaceService.inviteMember(req.params.workspaceId as string, req.body);
        res.status(201).json(ok(member));
    } catch (e) {
        next(e);
    }
};

export const updateMemberRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const member = await workspaceService.updateMemberRole(
            req.params.workspaceId as string,
            req.params.userId as string,
            req.body,
        );
        res.json(ok(member));
    } catch (e) {
        next(e);
    }
};

export const removeMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await workspaceService.removeMember(req.params.workspaceId as string, req.params.userId as string);
        res.status(204).send("Member removed successfully");
    } catch (e) {
        next(e);
    }
};