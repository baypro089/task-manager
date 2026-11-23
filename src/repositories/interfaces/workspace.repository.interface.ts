import type { Workspace, WorkspaceMember, WorkspaceRole } from '@/generated/prisma/client.js';

export interface WorkspaceWithCounts extends Workspace {
  _count: { members: number; projects: number };
}

export interface WorkspaceMemberWithUser extends WorkspaceMember {
  user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

export interface IWorkspaceRepository {
  findById(id: string): Promise<Workspace | null>;
  findBySlug(slug: string): Promise<Workspace | null>;
  findManyByUserId(userId: string): Promise<WorkspaceWithCounts[]>;
  findMember(workspaceId: string, userId: string): Promise<WorkspaceMember | null>;
  findMembersByWorkspaceId(workspaceId: string): Promise<WorkspaceMemberWithUser[]>;
  countOwners(workspaceId: string): Promise<number>;
  createWithOwner(data: { name: string; slug: string; ownerId: string }): Promise<Workspace>;
  update(id: string, data: { name?: string }): Promise<Workspace>;
  delete(id: string): Promise<void>;
  addMember(workspaceId: string, userId: string, role: WorkspaceRole): Promise<WorkspaceMember>;
  updateMemberRole(workspaceId: string, userId: string, role: WorkspaceRole): Promise<WorkspaceMemberWithUser>;
  removeMember(workspaceId: string, userId: string): Promise<void>;
}