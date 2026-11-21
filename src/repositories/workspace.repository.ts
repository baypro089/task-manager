// src/repositories/workspace/workspace.repository.ts
import { prisma } from '@/configuration/prisma.js';
import type {
    IWorkspaceRepository,
    WorkspaceWithCounts,
    WorkspaceMemberWithUser,
} from '@/repositories/interfaces/workspace.repository.interface.js';
import type { Workspace, WorkspaceMember, WorkspaceRole } from '@prisma/client';

export class WorkspaceRepository implements IWorkspaceRepository {
    async findById(id: string): Promise<Workspace | null> {
        return prisma.workspace.findUnique({ where: { id } });
    }

    async findBySlug(slug: string): Promise<Workspace | null> {
        return prisma.workspace.findUnique({ where: { slug } });
    }

    async findManyByUserId(userId: string): Promise<WorkspaceWithCounts[]> {
        return prisma.workspace.findMany({
            where: { members: { some: { userId } } },
            include: { _count: { select: { members: true, projects: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findMember(workspaceId: string, userId: string): Promise<WorkspaceMember | null> {
        return prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } },
        });
    }

    async findMembersByWorkspaceId(workspaceId: string): Promise<WorkspaceMemberWithUser[]> {
        return prisma.workspaceMember.findMany({
            where: { workspaceId },
            include: {
                user: { select: { id: true, email: true, displayName: true, avatarUrl: true } },
            },
            orderBy: { joinedAt: 'asc' },
        });
    }

    async countOwners(workspaceId: string): Promise<number> {
        return prisma.workspaceMember.count({
            where: { workspaceId, role: 'OWNER' },
        });
    }

    /** Transaction: tạo workspace + member OWNER atomic */
    async createWithOwner(data: { name: string; slug: string; ownerId: string }): Promise<Workspace> {
        return prisma.$transaction(async (tx) => {
            const workspace = await tx.workspace.create({
                data: { name: data.name, slug: data.slug, ownerId: data.ownerId },
            });
            await tx.workspaceMember.create({
                data: { workspaceId: workspace.id, userId: data.ownerId, role: 'OWNER' },
            });
            return workspace;
        });
    }

    async update(id: string, data: { name?: string }): Promise<Workspace> {
        return prisma.workspace.update({ where: { id }, data });
    }

    async delete(id: string): Promise<void> {
        await prisma.workspace.delete({ where: { id } }); // Cascade xóa project, task, member
    }

    async addMember(workspaceId: string, userId: string, role: WorkspaceRole): Promise<WorkspaceMember> {
        return prisma.workspaceMember.create({
            data: { workspaceId, userId, role },
        });
    }

    async updateMemberRole(workspaceId: string, userId: string, role: WorkspaceRole): Promise<WorkspaceMember> {
        return prisma.workspaceMember.update({
            where: { workspaceId_userId: { workspaceId, userId } },
            data: { role },
        });
    }

    async removeMember(workspaceId: string, userId: string): Promise<void> {
        await prisma.workspaceMember.delete({
            where: { workspaceId_userId: { workspaceId, userId } },
        });
    }
}