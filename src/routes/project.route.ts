// src/routes/project/project.route.ts
import { Router } from 'express';
import { authenticate } from '@/middlewares/auth.middleware.js';
import { validate } from '@/middlewares/validate.middleware.js';
import { requireWorkspaceMember, requireWorkspaceRole } from '@/middlewares/workspace-role.middleware.js';
import { requireProjectAccess } from '@/middlewares/project-access.middleware.js';
import { createProjectSchema, updateProjectSchema, queryProjectSchema } from '@/dtos/project.dto.js';
import { createStatusSchema, updateStatusSchema } from '@/dtos/task-status.dto.js';
import * as ctrl from '@/controllers/project.controller.js';

const router = Router();
router.use(authenticate);

// ============ Project (nested dưới workspace) ============

/**
 * @swagger
 * /workspaces/{workspaceId}/projects:
 *   post:
 *     summary: Tạo project (tự tạo 3 status mặc định)
 *     tags: [Projects]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: Website Redesign }
 *               description: { type: string }
 *               color: { type: string, example: '#3B82F6' }
 *     responses:
 *       201: { description: Tạo thành công, data: ProjectResponse }
 *       403: { description: Không đủ quyền (VIEWER) }
 */
router.post(
    '/workspaces/:workspaceId/projects',
    requireWorkspaceRole('OWNER', 'ADMIN', 'MEMBER'),
    validate(createProjectSchema),
    ctrl.createProject,
);

/**
 * @swagger
 * /workspaces/{workspaceId}/projects:
 *   get:
 *     summary: Danh sách project trong workspace
 *     tags: [Projects]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: includeArchived
 *         schema: { type: boolean, default: false }
 *     responses:
 *       200: { description: Danh sách project }
 */
router.get(
    '/workspaces/:workspaceId/projects',
    requireWorkspaceMember,
    validate(queryProjectSchema, 'query'),
    ctrl.listProjects,
);

// ============ Project (flat) ============

/**
 * @swagger
 * /projects/{projectId}:
 *   get:
 *     summary: Chi tiết project (bao gồm statuses)
 *     tags: [Projects]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: ProjectWithStatusesResponse }
 *       404: { description: Không tìm thấy hoặc không có quyền }
 */
router.get('/projects/:projectId', requireProjectAccess(), ctrl.getProject);

/**
 * @swagger
 * /projects/{projectId}:
 *   patch:
 *     summary: Cập nhật project (OWNER/ADMIN)
 *     tags: [Projects]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string, nullable: true }
 *               color: { type: string, nullable: true }
 *     responses:
 *       200: { description: Cập nhật thành công }
 *       403: { description: Không đủ quyền (MEMBER) }
 */
router.patch(
    '/projects/:projectId',
    requireProjectAccess('OWNER', 'ADMIN'),
    validate(updateProjectSchema),
    ctrl.updateProject,
);

/**
 * @swagger
 * /projects/{projectId}/archive:
 *   post:
 *     summary: Archive project (OWNER/ADMIN)
 *     tags: [Projects]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Archive thành công }
 */
router.post(
    '/projects/:projectId/archive',
    requireProjectAccess('OWNER', 'ADMIN'),
    ctrl.archiveProject,
);

/**
 * @swagger
 * /projects/{projectId}:
 *   delete:
 *     summary: Xóa project (OWNER/ADMIN) — cascade xóa task, status
 *     tags: [Projects]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Xóa thành công }
 */
router.delete(
    '/projects/:projectId',
    requireProjectAccess('OWNER', 'ADMIN'),
    ctrl.deleteProject,
);

// ============ TaskStatus ============

/**
 * @swagger
 * /projects/{projectId}/statuses:
 *   get:
 *     summary: Danh sách statuses của project
 *     tags: [Projects]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Danh sách statuses }
 */
router.get(
    '/projects/:projectId/statuses',
    requireProjectAccess(),
    ctrl.listStatuses,
);

/**
 * @swagger
 * /projects/{projectId}/statuses:
 *   post:
 *     summary: Tạo mới status cho project
 *     tags: [Projects]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: "In Progress" }
 *               position: { type: integer, example: 1 }
 *               isDone: { type: boolean, example: false } 
 *     responses:
 *       201: { description: Tạo mới status thành công }
 */
router.post(
    '/projects/:projectId/statuses',
    requireProjectAccess('OWNER', 'ADMIN', 'MEMBER'),
    validate(createStatusSchema),
    ctrl.createStatus,
);

/**
 * @swagger
 * /projects/{projectId}/statuses/{statusId}:
 *   patch:
 *     summary: Cập nhật status của project
 *     tags: [Projects]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: statusId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Cập nhật status thành công }
 */
router.patch(
    '/projects/:projectId/statuses/:statusId',
    requireProjectAccess('OWNER', 'ADMIN'),
    validate(updateStatusSchema),
    ctrl.updateStatus,
);

/**
 * @swagger
 * /projects/{projectId}/statuses/{statusId}:
 *   delete:
 *     summary: Xóa status của project (nếu không còn task nào đang dùng)
 *     tags: [Projects]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: statusId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Xóa status thành công }
 */
router.delete(
    '/projects/:projectId/statuses/:statusId',
    requireProjectAccess('OWNER', 'ADMIN'),
    ctrl.deleteStatus,
);

export default router;