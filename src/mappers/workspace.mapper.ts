// src/mappers/workspace.mapper.ts
import type { Workspace } from '@/generated/prisma/client.js';
import type {
    WorkspaceWithCounts,
    WorkspaceMemberWithUser,
} from '@/repositories/interfaces/workspace.repository.interface.js';
import type {
    WorkspaceResponse,
    WorkspaceWithCountsResponse,
    WorkspaceMemberResponse,
    WorkspaceResponseList,
    WorkspaceWithCountsResponseList,
    WorkspaceMemberResponseList,
} from '@/responses/workspace.respone.js';

export const WorkspaceMapper = {
    /**
     * Workspace cơ bản → Response DTO
     */
    toResponse(ws: Workspace): WorkspaceResponse {
        return {
            id: ws.id,
            name: ws.name,
            slug: ws.slug,
            ownerId: ws.ownerId,
            createdAt: ws.createdAt.toISOString(),
            updatedAt: ws.updatedAt.toISOString(),
        };
    },

    /**
     * Workspace có counts → Response DTO (dùng cho list)
     */
    toWithCounts(ws: WorkspaceWithCounts): WorkspaceWithCountsResponse {
        return {
            ...WorkspaceMapper.toResponse(ws),
            counts: {
                members: ws._count.members,
                projects: ws._count.projects,
            },
        };
    },

    /**
     * Member (kèm user) → Response DTO
     */
    toMemberResponse(m: WorkspaceMemberWithUser): WorkspaceMemberResponse {
        return {
            userId: m.userId,
            role: m.role,
            joinedAt: m.joinedAt.toISOString(),
            user: {
                id: m.user.id,
                email: m.user.email,
                displayName: m.user.displayName,
                avatarUrl: m.user.avatarUrl,
            },
        };
    },

    
    toResponseList(list: Workspace[]): WorkspaceResponseList {
        return list.map(WorkspaceMapper.toResponse);
    },

    toWithCountsList(list: WorkspaceWithCounts[]): WorkspaceWithCountsResponseList {
        return list.map(WorkspaceMapper.toWithCounts);
    },

    toMemberResponseList(list: WorkspaceMemberWithUser[]): WorkspaceMemberResponseList {
        return list.map(WorkspaceMapper.toMemberResponse);
    },
};