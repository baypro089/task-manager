// src/middlewares/workspace-role.middleware.ts
import type { Request, Response, NextFunction } from 'express';
import type { WorkspaceRole } from '@prisma/client';
import { workspaceRepository } from '../repositories/index.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors.js';

/** Chỉ cần là member (dùng cho GET detail, GET members) */
export const requireWorkspaceMember = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    if (!workspaceId) throw new BadRequestError('workspaceId is required');

    const member = await workspaceRepository.findMember(workspaceId, req.user!.id);
    if (!member) throw new NotFoundError('Workspace not found');

    req.workspaceMember = member;
    next();
  } catch (error) {
    next(error);
  }
};

/** Cần role cụ thể (dùng cho PATCH, DELETE, member management) */
export const requireWorkspaceRole = (...allowed: WorkspaceRole[]) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const workspaceId = req.params.workspaceId as string;
      if (!workspaceId) throw new BadRequestError('workspaceId is required');

      const member = await workspaceRepository.findMember(workspaceId, req.user!.id);
      if (!member) throw new NotFoundError('Workspace not found');
      if (!allowed.includes(member.role)) {
        throw new ForbiddenError('Insufficient permissions');
      }

      req.workspaceMember = member;
      next();
    } catch (error) {
      next(error);
    }
  };