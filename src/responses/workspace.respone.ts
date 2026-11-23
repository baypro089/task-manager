import type { WorkspaceRole } from '@/generated/prisma/client.js';

/** Shape cơ bản — trả về khi client chỉ cần thông tin workspace */
export interface WorkspaceResponse {
    id: string;
    name: string;
    slug: string;
    ownerId: string;
    createdAt: string; // ISO string — chuẩn JSON
    updatedAt: string;
}

export type WorkspaceResponseList = WorkspaceResponse[];

/** Shape có thêm counts — dùng cho GET /workspaces (list) */
export interface WorkspaceWithCountsResponse extends WorkspaceResponse {
    counts: {
        members: number;
        projects: number;
    };
}

export type WorkspaceWithCountsResponseList = WorkspaceWithCountsResponse[];

/** Shape của 1 member trong list */
export interface WorkspaceMemberResponse {
    userId: string;
    role: WorkspaceRole;
    joinedAt: string;
    user: {
        id: string;
        email: string;
        displayName: string;
        avatarUrl: string | null;
    };
}

export type WorkspaceMemberResponseList = WorkspaceMemberResponse[];
