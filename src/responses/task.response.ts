import type { TaskPriority } from '@/generated/prisma/client.js';

export interface TaskCardResponse {
    id: string;
    projectId: string;
    statusId: string;
    title: string;
    priority: TaskPriority;
    dueDate: string | null;
    position: number;
    counts: { subtasks: number; assignees: number; comments: number };
}

export interface TaskDetailResponse extends TaskCardResponse {
    description: string | null;
    parentId: string | null;
    createdById: string;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
    assignees: Array<{ userId: string; displayName: string; avatarUrl: string | null }>;
    labels: Array<{ id: string; name: string; color: string }>;
}

export interface BoardResponse {
    projectId: string;
    statuses: Array<{
        id: string;
        name: string;
        position: number;
        isDone: boolean;
        tasks: TaskCardResponse[];
    }>;
}