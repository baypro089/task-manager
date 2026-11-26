// src/repositories/task/task.repository.ts
import { prisma } from '@/configuration/prisma.js';
import type {
    ITaskRepository,
    TaskWithAssigneeCount,
    TaskWithRelations,
} from './interfaces/task.interface.repository.js';
import type { Task, TaskPriority, Prisma } from '@/generated/prisma/client.js';
import { TASK_COUNT_INCLUDE } from '@/constants/task.constant.js';

export class TaskRepository implements ITaskRepository {
    async findById(id: string): Promise<Task | null> {
        return prisma.task.findFirst({ where: { id, deletedAt: null } });
    }

    async findByIdWithRelations(id: string): Promise<TaskWithRelations | null> {
        return prisma.task.findFirst({
            where: { id, deletedAt: null },
            include: {
                assignees: {
                    include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
                },
                labels: { include: { label: { select: { id: true, name: true, color: true } } } },
                _count: { select: { subtasks: true, comments: true } },
                project: { select: { workspaceId: true } }, 
            },
        }) as Promise<TaskWithRelations | null>;
    }

    async findBoard(projectId: string): Promise<TaskWithAssigneeCount[]> {
        return prisma.task.findMany({
            where: { projectId, deletedAt: null, parentId: null }, // board chỉ hiển thị task cha
            orderBy: [{ statusId: 'asc' }, { position: 'asc' }],
            include: TASK_COUNT_INCLUDE,
        });
    }

    async findManyByProject(
        projectId: string,
        query: {
            statusId?: string;
            priority?: TaskPriority;
            search?: string;
            includeSubtasks: boolean;
            page: number;
            pageSize: number;
        },
    ): Promise<{ items: TaskWithAssigneeCount[]; total: number }> {
        const where: Prisma.TaskWhereInput = {
            projectId,
            deletedAt: null,
            ...(!query.includeSubtasks && { parentId: null }),
            ...(query.statusId && { statusId: query.statusId }),
            ...(query.priority && { priority: query.priority }),
            ...(query.search && {
                OR: [
                    { title: { contains: query.search, mode: 'insensitive' } },
                    { description: { contains: query.search, mode: 'insensitive' } },
                ],
            }),
        };

        const currentPage = Math.max(1, Math.floor(query.page || 1));
        const currentPageSize = Math.max(1, Math.floor(query.pageSize || 10));
        const skip = (currentPage - 1) * currentPageSize;

        const [items, total] = await prisma.$transaction([
            prisma.task.findMany({
                where,
                skip,
                take: currentPageSize,
                orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
                include: TASK_COUNT_INCLUDE,
            }),
            prisma.task.count({ where }),
        ]);

        return { items, total };
    }

    async findSiblingsInColumn(projectId: string, statusId: string, excludeId?: string): Promise<Task[]> {
        return prisma.task.findMany({
            where: { projectId, statusId, deletedAt: null, parentId: null,
                ...(excludeId && { id: { not: excludeId } }),
            },
            orderBy: { position: 'asc' },
        });
    }

    async create(data: {
        projectId: string;
        statusId: string;
        parentId?: string | null;
        title: string;
        description?: string;
        priority: TaskPriority;
        dueDate?: Date | null;
        position: number;
        createdById: string;
    }): Promise<Task> {
        return prisma.task.create({ data });
    }

    async update(id: string, data: Partial<Task>): Promise<Task> {
        return prisma.task.update({ where: { id }, data });
    }

    async softDelete(id: string): Promise<void> {
        await prisma.task.update({ where: { id }, data: { deletedAt: new Date() } });
    }

    async updatePositions(items: Array<{ id: string; position: number }>): Promise<void> {
        await prisma.$transaction(
            items.map(({ id, position }) =>
                prisma.task.update({ where: { id }, data: { position } }),
            ),
        );
    }
}