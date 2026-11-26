import type { Task, TaskPriority } from '@/generated/prisma/client.js';

export interface TaskWithAssigneeCount extends Task {
    _count: { subtasks: number; assignees: number; comments: number };
}

export interface TaskWithRelations extends Task {
    assignees: Array<{ userId: string; user: { id: string; displayName: string; avatarUrl: string | null } }>;
    labels: Array<{ label: { id: string; name: string; color: string } }>;
    _count: { subtasks: number; comments: number };
    project: { workspaceId: string }; // Thêm thông tin workspaceId từ project
}

export interface ITaskRepository {
    findById(id: string): Promise<Task | null>;
    findByIdWithRelations(id: string): Promise<TaskWithRelations | null>;
    findBoard(projectId: string): Promise<TaskWithAssigneeCount[]>;
    findManyByProject(projectId: string, query: {
        statusId?: string;
        priority?: TaskPriority;
        search?: string;
        includeSubtasks: boolean;
        page: number;
        pageSize: number;
    }): Promise<{ items: TaskWithAssigneeCount[]; total: number }>;
    findSiblingsInColumn(projectId: string, statusId: string, excludeId: string): Promise<Task[]>;
    create(data: {
        projectId: string;
        statusId: string;
        parentId?: string | null;
        title: string;
        description?: string;
        priority: TaskPriority;
        dueDate?: Date | null;
        position: number;
        createdById: string;
    }): Promise<Task>;
    update(id: string, data: Partial<Task>): Promise<Task>;
    softDelete(id: string): Promise<void>;
    updatePositions(items: Array<{ id: string; position: number }>): Promise<void>;
}