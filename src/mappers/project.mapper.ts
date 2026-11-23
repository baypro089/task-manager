// src/mappers/project.mapper.ts
import type { Project, TaskStatus } from '@prisma/client';
import type {
    ProjectWithCounts,
} from '@/repositories/interfaces/project.interface.repository.js';
import type {
    ProjectResponse,
    ProjectWithCountsResponse,
    ProjectWithStatusesResponse,
    TaskStatusResponse,
} from '@/responses/project.response.js';

export const ProjectMapper = {
    toResponse(p: Project): ProjectResponse {
        return {
            id: p.id,
            workspaceId: p.workspaceId,
            name: p.name,
            description: p.description,
            color: p.color,
            isArchived: p.isArchived,
            createdById: p.createdById,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
        };
    },

    toWithCounts(p: ProjectWithCounts): ProjectWithCountsResponse {
        return {
            ...ProjectMapper.toResponse(p),
            counts: {
                tasks: p._count.tasks,
                statuses: p._count.statuses,
            },
        };
    },

    toWithStatuses(p: Project & { statuses: TaskStatus[] }): ProjectWithStatusesResponse {
        return {
            ...ProjectMapper.toResponse(p),
            statuses: p.statuses.map(ProjectMapper.toStatusResponse),
        };
    },

    toStatusResponse(s: TaskStatus): TaskStatusResponse {
        return {
            id: s.id,
            projectId: s.projectId,
            name: s.name,
            position: s.position,
            isDone: s.isDone,
            createdAt: s.createdAt.toISOString(),
        };
    },

    toWithCountsList(list: ProjectWithCounts[]): ProjectWithCountsResponse[] {
        return list.map(ProjectMapper.toWithCounts);
    },

    toStatusResponseList(list: TaskStatus[]): TaskStatusResponse[] {
        return list.map(ProjectMapper.toStatusResponse);
    },
};