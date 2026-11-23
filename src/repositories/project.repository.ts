// src/repositories/project/project.repository.ts
import { prisma } from '@/configuration/prisma.js';
import type {
    IProjectRepository,
    ProjectWithCounts,
    FindManyProjectsResult,
} from '@/repositories/interfaces/project.interface.repository.js';
import type { Project, TaskStatus } from '@/generated/prisma/client.js';
import { DEFAULT_STATUSES } from '@/constants/project.constant.js';

export class ProjectRepository implements IProjectRepository {
    async findById(id: string): Promise<Project | null> {
        return prisma.project.findUnique({ where: { id } });
    }

    async findByIdWithStatuses(id: string): Promise<(Project & { statuses: TaskStatus[] }) | null> {
        return prisma.project.findUnique({
            where: { id },
            include: { statuses: { orderBy: { position: 'asc' } } },
        });
    }

    async findManyByWorkspace(
        workspaceId: string,
        query: {
            includeArchived: boolean,
            page: number,
            pageSize: number,
        }
    ): Promise<FindManyProjectsResult> {
        const where = {
            workspaceId,
            ...(!query.includeArchived && { isArchived: false }),
        };

        const currentPage = Math.max(1, Math.floor(query.page || 1));
        const currentPageSize = Math.max(1, Math.floor(query.pageSize || 10));
        const skip = (currentPage - 1) * currentPageSize;

        const [items, total] = await prisma.$transaction([
            prisma.project.findMany({
                where,
                skip: skip,
                take: currentPageSize,
                orderBy: { createdAt: 'desc' },
                include: { _count: { select: { tasks: true, statuses: true } } },
            }),
            prisma.project.count({ where }),
        ]);

        return { items: items as ProjectWithCounts[], total };
    }

    /** Transaction: tạo project + 3 status mặc định (atomic) */
    async createWithDefaultStatuses(data: {
        workspaceId: string;
        name: string;
        description?: string;
        color?: string;
        createdById: string;
    }): Promise<Project> {
        return prisma.$transaction(async (tx) => {
            const project = await tx.project.create({
                data: {
                    workspaceId: data.workspaceId,
                    name: data.name,
                    description: data.description,
                    color: data.color,
                    createdById: data.createdById,
                },
            });
            await tx.taskStatus.createMany({
                data: DEFAULT_STATUSES.map((s) => ({
                    projectId: project.id,
                    name: s.name,
                    position: s.position,
                    isDone: s.isDone,
                })),
            });
            return project;
        });
    }

    async update(
        id: string,
        data: { name?: string; description?: string | null; color?: string | null },
    ): Promise<Project> {
        return prisma.project.update({ where: { id }, data });
    }

    async archive(id: string): Promise<Project> {
        return prisma.project.update({ where: { id }, data: { isArchived: true } });
    }

    async delete(id: string): Promise<void> {
        await prisma.project.delete({ where: { id } }); // Cascade xóa status, task, label
    }

    async findStatusById(statusId: string): Promise<TaskStatus | null> {
        return prisma.taskStatus.findUnique({ where: { id: statusId } });
    }

    async findStatusesByProjectId(projectId: string): Promise<TaskStatus[]> {
        return prisma.taskStatus.findMany({
            where: { projectId },
            orderBy: { position: 'asc' },
        });
    }

    async createStatus(
        projectId: string,
        data: { name: string; position: number; isDone: boolean },
    ): Promise<TaskStatus> {
        return prisma.taskStatus.create({ data: { projectId, ...data } });
    }

    async updateStatus(
        statusId: string,
        data: { name?: string; position?: number; isDone?: boolean },
    ): Promise<TaskStatus> {
        return prisma.taskStatus.update({ where: { id: statusId }, data });
    }

    async deleteStatus(statusId: string): Promise<void> {
        await prisma.taskStatus.delete({ where: { id: statusId } });
    }

    async countTasksByStatus(statusId: string): Promise<number> {
        return prisma.task.count({ where: { statusId, deletedAt: null } });
    }
}