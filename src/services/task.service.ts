import { WorkspaceRole, type TaskPriority } from '@/generated/prisma/client.js';
import type { ITaskRepository } from '@/repositories/interfaces/task.interface.repository.js';
import type { IProjectRepository } from '@/repositories/interfaces/project.interface.repository.js';
import type { IWorkspaceRepository } from '@/repositories/interfaces/workspace.repository.interface.js';
import type {
    CreateTaskDto,
    UpdateTaskDto,
    MoveTaskDto,
    QueryTaskDto
} from '@/dtos/task.dto.js';
import type {
    TaskCardResponse,
    TaskDetailResponse,
    BoardResponse,
} from '@/responses/task.response.js';
import { TaskMapper } from '@/mappers/task.mapper.js';
import {
    BadRequestError,
    ForbiddenError,
    NotFoundError,
} from '@/utils/errors.js';
import {
    calculatePosition,
    RebalanceRequiredError,
    rebalancePositions,
} from '@/utils/position.js';
import { cacheService } from './cache.service.js';
import { CACHE_KEYS_TASK, CACHE_TTL_TASK } from '@/configuration/cache.js';

/**

/**
 * Kiểm tra user có quyền EDIT task không.
 * OWNER/ADMIN trong workspace → full.
 * MEMBER → chỉ khi là creator hoặc assignee.
 * VIEWER →
 * Kiểm tra user có quyền EDIT task không.
 * OWNER/ADMIN trong workspace → full.
 * MEMBER → chỉ khi là creator hoặc assignee.
 * VIEWER → không được edit.
 */
function canEditTask(
    memberRole: string,
    userId: string,
    task: { createdById: string },
    assigneeIds: string[],
): boolean {
    if (memberRole === WorkspaceRole.OWNER || memberRole === WorkspaceRole.ADMIN) return true;
    if (memberRole === WorkspaceRole.VIEWER) return false;
    // MEMBER
    return task.createdById === userId || assigneeIds.includes(userId);
}

export class TaskService {
    constructor(private taskRepo: ITaskRepository,
        private projectRepository: IProjectRepository,
        private workspaceRepository: IWorkspaceRepository
    ) { }

    async createTask(
        projectId: string,
        userId: string,
        dto: CreateTaskDto,
    ): Promise<TaskCardResponse> {
        // Validate status thuộc project
        const status = await this.projectRepository.findStatusById(dto.statusId);
        if (!status || status.projectId !== projectId) {
            throw new BadRequestError('Status does not belong to this project');
        }

        // Validate parentId nếu có subtask
        if (dto.parentId) {
            const parent = await this.taskRepo.findById(dto.parentId);
            if (!parent || parent.projectId !== projectId) {
                throw new BadRequestError('Parent task not found in this project');
            }
        }

        // Tính position cuối cột
        const siblings = await this.taskRepo.findSiblingsInColumn(projectId, dto.statusId, '');
        const lastPos = siblings.length > 0 ? siblings[siblings.length - 1]!.position : null;
        const position = calculatePosition(lastPos, null);

        const task = await this.taskRepo.create({
            projectId,
            statusId: dto.statusId,
            parentId: dto.parentId,
            title: dto.title,
            description: dto.description,
            priority: dto.priority as TaskPriority,
            dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
            position,
            createdById: userId,
        });

        await this.invalidateBoard(projectId);
        const full = await this.taskRepo.findByIdWithRelations(task.id);
        return TaskMapper.toCardFromRelations(full!);
    }

    async getBoard(projectId: string): Promise<BoardResponse> {
        const key = CACHE_KEYS_TASK.board(projectId);
        return cacheService.getOrSet(key, CACHE_TTL_TASK.BOARD, async () => {
            const [statuses, tasks] = await Promise.all([
                this.projectRepository.findStatusesByProjectId(projectId),
                this.taskRepo.findBoard(projectId),
            ]);

            return {
                projectId,
                statuses: statuses.map((s) => ({
                    id: s.id,
                    name: s.name,
                    position: s.position,
                    isDone: s.isDone,
                    tasks: TaskMapper.toCardList(tasks.filter((t) => t.statusId === s.id)),
                })),
            };
        });
    }

    async getTask(taskId: string): Promise<TaskDetailResponse> {
        const key = CACHE_KEYS_TASK.detail(taskId);
        return cacheService.getOrSet(key, CACHE_TTL_TASK.DETAIL, async () => {
            const task = await this.taskRepo.findByIdWithRelations(taskId);
            if (!task) throw new NotFoundError('Task not found');
            return TaskMapper.toDetail(task);
        });
    }

    async updateTask(
        taskId: string,
        userId: string,
        dto: UpdateTaskDto,
    ): Promise<TaskDetailResponse> {
        const task = await this.taskRepo.findByIdWithRelations(taskId);
        if (!task) throw new NotFoundError('Task not found');

        const member = await this.workspaceRepository.findMember(task.project.workspaceId, userId);
        if (!member) throw new NotFoundError('Task not found');

        const assigneeIds = task.assignees.map((a) => a.userId);
        if (!canEditTask(member.role, userId, task, assigneeIds)) {
            throw new ForbiddenError('You cannot edit this task');
        }

        await this.taskRepo.update(taskId, {
            ...dto,
            dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        });

        await this.invalidateTask(taskId, task.projectId);
        // Trả lại task đã update (query lại để có relations mới)
        const updated = await this.taskRepo.findByIdWithRelations(taskId);
        return TaskMapper.toDetail(updated!);
    }

    /**
     * Kéo thả task trong kanban — phần phức tạp nhất.
     * Atomic: đổi statusId + position trong 1 lần update.
     */
    async moveTask(
        taskId: string,
        projectId: string,
        userId: string,
        dto: MoveTaskDto,
    ): Promise<TaskCardResponse> {
        const task = await this.taskRepo.findByIdWithRelations(taskId);
        if (!task || task.projectId !== projectId) throw new NotFoundError('Task not found');

        // Permission: giống update
        const member = await this.workspaceRepository.findMember(task.project.workspaceId, userId);
        if (!member) throw new NotFoundError('Task not found');
        const assigneeIds = task.assignees.map((a) => a.userId);
        if (!canEditTask(member.role, userId, task, assigneeIds)) {
            throw new ForbiddenError('You cannot move this task');
        }

        // Validate target status
        const targetStatus = await this.projectRepository.findStatusById(dto.statusId);
        if (!targetStatus || targetStatus.projectId !== projectId) {
            throw new BadRequestError('Target status does not belong to this project');
        }

        // Lấy position của prev/next
        const siblings = await this.taskRepo.findSiblingsInColumn(projectId, dto.statusId, taskId);
        const byId = new Map(siblings.map((s) => [s.id, s.position]));

        const prevPos = dto.prevTaskId ? byId.get(dto.prevTaskId) ?? null : null;
        const nextPos = dto.nextTaskId ? byId.get(dto.nextTaskId) ?? null : null;

        // Nếu cả hai đều null → append cuối cột
        let newPosition: number;
        if (prevPos === null && nextPos === null) {
            const last = siblings.length > 0 ? siblings[siblings.length - 1]!.position : null;
            newPosition = calculatePosition(last, null);
        } else {
            try {
                newPosition = calculatePosition(prevPos, nextPos);
            } catch (e) {
                if (e instanceof RebalanceRequiredError) {
                    // Rebalance toàn bộ cột đích rồi tính lại
                    const rebalanced = rebalancePositions(
                        siblings.map((s) => ({ id: s.id, position: s.position })),
                    );
                    await this.taskRepo.updatePositions(rebalanced);

                    // Tính lại prev/next từ dữ liệu mới
                    const newByPos = new Map(rebalanced.map((r) => [r.id, r.position]));
                    const newPrev = dto.prevTaskId ? newByPos.get(dto.prevTaskId) ?? null : null;
                    const newNext = dto.nextTaskId ? newByPos.get(dto.nextTaskId) ?? null : null;
                    newPosition = calculatePosition(newPrev, newNext);
                } else {
                    throw e;
                }
            }
        }

        // Nếu chuyển sang cột "done" (isDone=true) và task chưa completed → set completedAt
        const completedAt = targetStatus.isDone && !task.completedAt ? new Date() : task.completedAt;

        await this.taskRepo.update(taskId, {
            statusId: dto.statusId,
            position: newPosition,
            completedAt,
        });

        await this.invalidateTask(taskId, projectId);
        const updated = await this.taskRepo.findByIdWithRelations(taskId);
        return TaskMapper.toCardFromRelations(updated!);
    }

    async deleteTask(taskId: string, userId: string): Promise<void> {
        const task = await this.taskRepo.findByIdWithRelations(taskId);
        if (!task) throw new NotFoundError('Task not found');

        const member = await this.workspaceRepository.findMember(task.project.workspaceId, userId);
        if (!member) throw new NotFoundError('Task not found');

        // Chỉ creator, OWNER, ADMIN mới xóa được — assignee KHÔNG được xóa
        const canDelete =
            member.role === WorkspaceRole.OWNER ||
            member.role === WorkspaceRole.ADMIN ||
            task.createdById === userId;
        if (!canDelete) throw new ForbiddenError('You cannot delete this task');

        await this.taskRepo.softDelete(taskId);
        await this.invalidateTask(taskId, task.projectId);
    }

    async listTasks(
        projectId: string,
        query: QueryTaskDto,
    ): Promise<PageResult<TaskCardResponse>> {
        const hash = require('crypto')
            .createHash('md5')
            .update(JSON.stringify({ ...query, projectId }))
            .digest('hex');
        const version = await cacheService.getVersion(CACHE_KEYS_TASK.listVersion(projectId));
        const key = CACHE_KEYS_TASK.list(projectId, version, hash);

        return cacheService.getOrSet(key, CACHE_TTL_TASK.LIST, async () => {
            const { items, total } = await this.taskRepo.findManyByProject(projectId, query);
            return {
                data: TaskMapper.toCardList(items),
                total,
                page: query.page || 1,
                pageSize: query.pageSize || 10,
                totalPages: Math.ceil(total / (query.pageSize || 10)),
                previousPage: (query.page || 1) > 1,
                nextPage: (query.page || 1) * (query.pageSize || 10) < total,
            };
        });
    }

    // ---------- Cache invalidation ----------

    private async invalidateBoard(projectId: string): Promise<void> {
        await Promise.all([
            cacheService.del(CACHE_KEYS_TASK.board(projectId)),
            cacheService.bumpVersion(CACHE_KEYS_TASK.listVersion(projectId)),
        ]);
    }

    private async invalidateTask(taskId: string, projectId: string): Promise<void> {
        await Promise.all([
            cacheService.del(CACHE_KEYS_TASK.detail(taskId)),
            cacheService.del(CACHE_KEYS_TASK.board(projectId)),
            cacheService.bumpVersion(CACHE_KEYS_TASK.listVersion(projectId)),
        ]);
    }
}

import { taskRepository, projectRepository, workspaceRepository } from '@/repositories/index.js';
import type { PageResult } from '@/types/page.type.js';
export const taskService = new TaskService(taskRepository, projectRepository, workspaceRepository);