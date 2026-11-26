import type {
    TaskWithAssigneeCount,
    TaskWithRelations,
} from '@/repositories/interfaces/task.interface.repository.js';
import type { TaskCardResponse, TaskDetailResponse } from '@/responses/task.response.js';

export const TaskMapper = {
    toCard(t: TaskWithAssigneeCount): TaskCardResponse {
        return {
            id: t.id,
            projectId: t.projectId,
            statusId: t.statusId,
            title: t.title,
            priority: t.priority,
            dueDate: t.dueDate?.toISOString() ?? null,
            position: t.position,
            counts: {
                subtasks: t._count.subtasks,
                assignees: t._count.assignees,
                comments: t._count.comments,
            },
        };
    },

    toDetail(t: TaskWithRelations): TaskDetailResponse {
        return {
            id: t.id,
            projectId: t.projectId,
            statusId: t.statusId,
            title: t.title,
            description: t.description,
            priority: t.priority,
            dueDate: t.dueDate?.toISOString() ?? null,
            position: t.position,
            parentId: t.parentId,
            createdById: t.createdById,
            completedAt: t.completedAt?.toISOString() ?? null,
            createdAt: t.createdAt.toISOString(),
            updatedAt: t.updatedAt.toISOString(),
            counts: {
                subtasks: t._count.subtasks,
                assignees: t.assignees.length,
                comments: t._count.comments,
            },
            assignees: t.assignees.map((a) => ({
                userId: a.userId,
                displayName: a.user.displayName,
                avatarUrl: a.user.avatarUrl,
            })),
            labels: t.labels.map((l) => l.label),
        };
    },

    toCardFromRelations(t: TaskWithRelations): TaskCardResponse {
        return {
            id: t.id,
            projectId: t.projectId,
            statusId: t.statusId,
            title: t.title,
            priority: t.priority,
            dueDate: t.dueDate?.toISOString() ?? null,
            position: t.position,
            counts: {
                subtasks: t._count.subtasks,
                assignees: t.assignees.length,
                comments: t._count.comments,
            },
        };
    },

    toCardList(list: TaskWithAssigneeCount[]): TaskCardResponse[] {
        return list.map(TaskMapper.toCard);
    },
};