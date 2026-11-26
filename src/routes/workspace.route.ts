// src/routes/workspace/workspace.route.ts
import { Router } from 'express';
import { authenticate } from '@/middlewares/auth.middleware.js';
import { validate } from '@/middlewares/validate.middleware.js';
import { requireWorkspaceMember, requireWorkspaceRole } from '@/middlewares/workspace-role.middleware.js';
import { createWorkspaceSchema, updateWorkspaceSchema, inviteMemberSchema, updateRoleSchema } from '@/dtos/workspace.dto.js';
import {
    createWorkspace,
    listMyWorkspaces,
    getWorkspace,
    updateWorkspace,
    deleteWorkspace,
    listMembers,
    inviteMember,
    updateMemberRole,
    removeMember,
} from '@/controllers/workspace.controller.js';
import { WorkspaceRole } from '@/generated/prisma/browser.js';

const router = Router();

// Tất cả route workspace đều cần đăng nhập
router.use(authenticate);

/**
 * @swagger
 * /workspaces:
 *   post:
 *     summary: Tạo workspace mới (người tạo tự động là OWNER)
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: My Team
 *               slug:
 *                 type: string
 *                 example: my-team
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       409:
 *         description: Slug đã tồn tại
 */
router.post('/', validate(createWorkspaceSchema), createWorkspace);

/**
 * @swagger
 * /workspaces:
 *   get:
 *     summary: Danh sách workspace mà tôi là thành viên
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', listMyWorkspaces);

/**
 * @swagger
 * /workspaces/{workspaceId}:
 *   get:
 *     summary: Chi tiết workspace
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Thành công }
 *       404: { description: Không tìm thấy hoặc không có quyền }
 */
router.get('/:workspaceId', requireWorkspaceMember, getWorkspace);

/**
 * @swagger
 * /workspaces/{workspaceId}:
 *   patch:
 *     summary: Cập nhật workspace (chỉ OWNER/ADMIN)
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *     responses:
 *       200: { description: Thành công }
 *       403: { description: Không đủ quyền }
 */
router.patch(
    '/:workspaceId',
    requireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN),
    validate(updateWorkspaceSchema),
    updateWorkspace,
);

/**
 * @swagger
 * /workspaces/{workspaceId}:
 *   delete:
 *     summary: Xóa workspace (chỉ OWNER)
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Xóa thành công }
 *       403: { description: Chỉ OWNER được xóa }
 */
router.delete('/:workspaceId', requireWorkspaceRole(WorkspaceRole.OWNER), deleteWorkspace);

/**
 * @swagger
 * /workspaces/{workspaceId}/members:
 *   get:
 *     summary: Danh sách thành viên
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Thành công }
 */
router.get('/:workspaceId/members', requireWorkspaceMember, listMembers);

/**
 * @swagger
 * /workspaces/{workspaceId}/members:
 *   post:
 *     summary: Mời thành viên (chỉ OWNER/ADMIN)
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
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
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *               role:
 *                 type: string
 *                 enum: [ADMIN, MEMBER, VIEWER]
 *                 default: MEMBER
 *     responses:
 *       201: { description: Mời thành công }
 *       400: { description: User chưa đăng ký }
 *       409: { description: Đã là thành viên }
 */
router.post(
    '/:workspaceId/members',
    requireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN),
    validate(inviteMemberSchema),
    inviteMember,
);

/**
 * @swagger
 * /workspaces/{workspaceId}/members/{userId}:
 *   patch:
 *     summary: Đổi role thành viên (chỉ OWNER)
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [OWNER, ADMIN, MEMBER, VIEWER]
 *     responses:
 *       200: { description: Thành công }
 *       400: { description: Không thể hạ cấp OWNER cuối }
 */
router.patch(
    '/:workspaceId/members/:userId',
    requireWorkspaceRole(WorkspaceRole.OWNER),
    validate(updateRoleSchema),
    updateMemberRole,
);

/**
 * @swagger
 * /workspaces/{workspaceId}/members/{userId}:
 *   delete:
 *     summary: Xóa thành viên (OWNER/ADMIN)
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Xóa thành công }
 *       400: { description: Không thể xóa OWNER cuối }
 */
router.delete(
    '/:workspaceId/members/:userId',
    requireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN),
    removeMember,
);

export default router;