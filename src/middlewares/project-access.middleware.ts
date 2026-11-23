import type { Request, Response, NextFunction } from 'express';
import type { WorkspaceRole } from '@prisma/client';
import { projectRepository, workspaceRepository } from '../repositories/index.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors.js';

/**
 * Resolve project từ projectId, kiểm tra user là member của workspace tương ứng.
 * Nếu truyền allowedRoles → kiểm tra thêm role.
 * Gắn req.project và req.workspaceMember để Service dùng lại.
 */
export const requireProjectAccess = (...allowedRoles: WorkspaceRole[]) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.projectId as string;
      if (!projectId) throw new BadRequestError('projectId is required');

      const project = await projectRepository.findById(projectId);
      // Ẩn sự tồn tại của project nếu user không phải member → trả 404, không phải 403
      if (!project) throw new NotFoundError('Project not found');

      const member = await workspaceRepository.findMember(project.workspaceId, req.user!.id);
      if (!member) throw new NotFoundError('Project not found');

      if (allowedRoles.length > 0 && !allowedRoles.includes(member.role)) {
        throw new ForbiddenError('Insufficient permissions');
      }

      req.project = project;
      req.workspaceMember = member;
      next();
    } catch (error) {
      next(error);
    }
  };