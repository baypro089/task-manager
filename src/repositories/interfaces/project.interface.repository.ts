import type { Project, TaskStatus } from '@/generated/prisma/client.js';

export interface ProjectWithCounts extends Project {
    _count: { tasks: number; statuses: number };
}

export interface FindManyProjectsResult {
    items: ProjectWithCounts[];
    total: number;
}

export interface IProjectRepository {
    findById(id: string): Promise<Project | null>;
    findByIdWithStatuses(id: string): Promise<(Project & { statuses: TaskStatus[] }) | null>;
    findManyByWorkspace(
        workspaceId: string,
        query: {
            includeArchived: boolean,
            page: number,
            pageSize: number,
        },
    ): Promise<FindManyProjectsResult>;
    /** Transaction: tạo project + 3 status mặc định */
    createWithDefaultStatuses(data: {
        workspaceId: string;
        name: string;
        description?: string;
        color?: string;
        createdById: string;
    }): Promise<Project>;
    update(id: string, data: { name?: string; description?: string | null; color?: string | null }): Promise<Project>;
    archive(id: string): Promise<Project>;
    delete(id: string): Promise<void>;
    findStatusById(statusId: string): Promise<TaskStatus | null>;
    findStatusesByProjectId(projectId: string): Promise<TaskStatus[]>;
    createStatus(projectId: string, data: { name: string; position: number; isDone: boolean }): Promise<TaskStatus>;
    updateStatus(statusId: string, data: { name?: string; position?: number; isDone?: boolean }): Promise<TaskStatus>;
    deleteStatus(statusId: string): Promise<void>;
    countTasksByStatus(statusId: string): Promise<number>;
}