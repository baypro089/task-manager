import { Router } from 'express';
import { authenticate } from '@/middlewares/auth.middleware.js';
import { validate } from '@/middlewares/validate.middleware.js';
import { requireProjectAccess } from '@/middlewares/project-access.middleware.js';
import { requireTaskAccess } from '@/middlewares/task-access.middleware.js';
import { createTaskSchema, updateTaskSchema, moveTaskSchema, queryTaskSchema } from '@/dtos/task.dto.js';
import * as ctrl from '@/controllers/task.controller.js';
import { WorkspaceRole } from '@/generated/prisma/browser.js';

const router = Router();
router.use(authenticate);

// ============ Board (kanban view) ============
/**
 * @swagger
 * /projects/{projectId}/board:
 *   get:
 *     summary: Kanban board (tasks nhóm theo status)
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Board với statuses và tasks }
 */
router.get('/projects/:projectId/board', requireProjectAccess(), ctrl.getBoard);

// ============ Task CRUD ============
/**
 * @swagger
 * /projects/{projectId}/tasks:
 *   post:
 *     summary: Tạo task (VIEWER không được tạo)
 *     tags: [Tasks]
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
 *             required: [title, statusId]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               statusId: { type: string, format: uuid }
 *               priority: { type: string, enum: [LOW, MEDIUM, HIGH, URGENT] }
 *               dueDate: { type: string, format: date-time, nullable: true }
 *               parentId: { type: string, format: uuid, nullable: true }
 *     responses:
 *       201: { description: Tạo thành công }
 *       400: { description: Status không thuộc project }
 */
router.post(
    '/projects/:projectId/tasks',
    requireProjectAccess(WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.MEMBER),
    validate(createTaskSchema),
    ctrl.createTask,
);

/**
 * @swagger
 * /tasks/{taskId}:
 *   delete:
 *     summary: Xóa task
 *     description: |
 *       Xóa một task khỏi hệ thống.
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Xóa thành công }
 *       403: { description: Không có quyền xóa (không phải creator/assignee) }
 */
router.delete(
    '/tasks/:taskId',
    requireTaskAccess(),
    ctrl.deleteTask,
);

/**
 * @swagger
 * /projects/{projectId}/tasks:
 *   get:
 *     summary: Danh sách task trong project (có phân trang)
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: statusId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [LOW, MEDIUM, HIGH, URGENT] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: includeSubtasks
 *         schema: { type: boolean }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *     responses:
 *       200: { description: Danh sách task với phân trang }
 */
router.get(
    '/projects/:projectId/tasks',
    requireProjectAccess(),
    validate(queryTaskSchema, 'query'),
    ctrl.listTasks,
);

router.get('/tasks/:taskId', requireTaskAccess(), ctrl.getTask);

/**
 * @swagger
 * /tasks/{taskId}:
 *   patch:
 *     summary: Cập nhật task
 *     description: |
 *       Cập nhật thông tin của một task.
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               statusId: { type: string, format: uuid }
 *               priority: { type: string, enum: [LOW, MEDIUM, HIGH, URGENT] }
 *               dueDate: { type: string, format: date-time, nullable: true }
 *               parentId: { type: string, format: uuid, nullable: true }
 *     responses:
 *       200: { description: Cập nhật thành công }
 *       403: { description: Không có quyền cập nhật (không phải creator/assignee) }
 */
router.patch(
    '/tasks/:taskId',
    requireTaskAccess(),
    validate(updateTaskSchema),
    ctrl.updateTask,
);

/**
 * @swagger
 * /projects/{projectId}/tasks/{taskId}/move:
 *   patch:
 *     summary: Kéo thả task trong kanban
 *     description: |
 *       - `prevTaskId`: task sẽ nằm ngay TRÊN (null = lên đầu cột)
 *       - `nextTaskId`: task sẽ nằm ngay DƯỚI (null = xuống cuối cột)
 *       - Nếu cả hai null → append cuối cột
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [statusId]
 *             properties:
 *               statusId: { type: string, format: uuid }
 *               prevTaskId: { type: string, format: uuid, nullable: true }
 *               nextTaskId: { type: string, format: uuid, nullable: true }
 *     responses:
 *       200: { description: Move thành công, trả TaskCard }
 *       403: { description: Không có quyền move (không phải creator/assignee) }
 */
router.patch(
    '/projects/:projectId/tasks/:taskId/move',
    requireProjectAccess(),
    validate(moveTaskSchema),
    ctrl.moveTask,
);


/*
 * @swagger
 * /tasks/{taskId}:
 *   delete:
 *     summary: Xóa task
 *     description: |
 *       Xóa một task khỏi hệ thống.
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Xóa thành công }
 *       403: { description: Không có quyền xóa (không phải creator/assignee) }
 */
router.delete(
    '/tasks/:taskId',
    requireTaskAccess(),
    ctrl.deleteTask,
);

export default router;