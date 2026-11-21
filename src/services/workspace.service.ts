// src/services/workspace/workspace.service.ts
import slugify from 'slugify';
import type { Workspace, WorkspaceMember, WorkspaceRole } from '@prisma/client';
import type {
    IWorkspaceRepository,
    WorkspaceWithCounts,
    WorkspaceMemberWithUser,
} from '@/repositories/interfaces/workspace.repository.interface.js';
import type { CreateWorkspaceDto } from '@/dtos/workspace.dto.js';
import type { UpdateWorkspaceDto } from '@/dtos/workspace.dto.js';
import type { InviteMemberDto } from '@/dtos/workspace.dto.js';
import type { UpdateRoleDto } from '@/dtos/workspace.dto.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '@/utils/errors.js';
import { cacheService } from '@/services/cache.service.js';
import { userRepository } from '@/repositories/index.js';
import { CACHE_KEYS_WORKSPACE, CACHE_TTL_WORKSPACE} from '@/configuration/cache.js';

export class WorkspaceService {
    constructor(private workspaceRepo: IWorkspaceRepository) { }

    async createWorkspace(userId: string, dto: CreateWorkspaceDto): Promise<Workspace> {
        const baseSlug = dto.slug ?? slugify(dto.name, { lower: true, strict: true, locale: 'vi' });
        const slug = await this.ensureUniqueSlug(baseSlug);

        const workspace = await this.workspaceRepo.createWithOwner({
            name: dto.name,
            slug,
            ownerId: userId,
        });

        await this.invalidateUserWorkspaceList(userId);
        return workspace;
    }

    private async ensureUniqueSlug(base: string): Promise<string> {
        let slug = base;
        let counter = 1;
        while (await this.workspaceRepo.findBySlug(slug)) {
            slug = `${base}-${counter++}`;
            if (counter > 100) throw new ConflictError('Cannot generate unique slug');
        }
        return slug;
    }

    /** User phải là member mới xem được */
    async getWorkspaceById(workspaceId: string, userId: string): Promise<Workspace> {
        const member = await this.workspaceRepo.findMember(workspaceId, userId);
        if (!member) throw new NotFoundError('Workspace not found');

        const key = CACHE_KEYS_WORKSPACE.detail(workspaceId);
        return cacheService.getOrSet(key, CACHE_TTL_WORKSPACE.WORKSPACE_DETAIL, async () => {
            const ws = await this.workspaceRepo.findById(workspaceId);
            if (!ws) throw new NotFoundError('Workspace not found');
            return ws;
        });
    }

    async listMyWorkspaces(userId: string): Promise<WorkspaceWithCounts[]> {
        const version = await cacheService.getVersion(CACHE_KEYS_WORKSPACE.listVersion(userId));
        const key = CACHE_KEYS_WORKSPACE.list(userId, version);

        return cacheService.getOrSet(key, CACHE_TTL_WORKSPACE.WORKSPACE_LIST, () =>
            this.workspaceRepo.findManyByUserId(userId),
        );
    }

    async updateWorkspace(workspaceId: string, dto: UpdateWorkspaceDto): Promise<Workspace> {
        const updated = await this.workspaceRepo.update(workspaceId, dto);
        await this.invalidateWorkspaceCache(workspaceId, updated.ownerId);
        return updated;
    }

    /** Chỉ OWNER mới xóa được — middleware đã check nhưng Service vẫn verify */
    async deleteWorkspace(workspaceId: string, userId: string): Promise<void> {
        const ws = await this.workspaceRepo.findById(workspaceId);
        if (!ws) throw new NotFoundError('Workspace not found');
        if (ws.ownerId !== userId) throw new ForbiddenError('Only owner can delete workspace');

        await this.workspaceRepo.delete(workspaceId);
        await this.invalidateWorkspaceCache(workspaceId, userId);
    }

    async listMembers(workspaceId: string, userId: string): Promise<WorkspaceMemberWithUser[]> {
        const member = await this.workspaceRepo.findMember(workspaceId, userId);
        if (!member) throw new NotFoundError('Workspace not found');

        const key = CACHE_KEYS_WORKSPACE.memberList(workspaceId);
        return cacheService.getOrSet(key, CACHE_TTL_WORKSPACE.MEMBER_LIST, () =>
            this.workspaceRepo.findMembersByWorkspaceId(workspaceId),
        );
    }

    async inviteMember(workspaceId: string, dto: InviteMemberDto): Promise<WorkspaceMember> {
        const invitee = await userRepository.findByEmail(dto.email);
        if (!invitee) {
            throw new BadRequestError(`User with email ${dto.email} has not registered yet`);
        }

        const existing = await this.workspaceRepo.findMember(workspaceId, invitee.id);
        if (existing) throw new ConflictError('User is already a member of this workspace');

        const member = await this.workspaceRepo.addMember(
            workspaceId,
            invitee.id,
            dto.role as WorkspaceRole,
        );
        await this.invalidateMembersCache(workspaceId);
        await this.invalidateUserWorkspaceList(invitee.id);
        return member;
    }

    async updateMemberRole(
        workspaceId: string,
        targetUserId: string,
        dto: UpdateRoleDto,
    ): Promise<WorkspaceMember> {
        const target = await this.workspaceRepo.findMember(workspaceId, targetUserId);
        if (!target) throw new NotFoundError('Member not found');

        // Hạ cấp OWNER → không cho phép nếu là OWNER cuối
        if (target.role === 'OWNER' && dto.role !== 'OWNER') {
            const owners = await this.workspaceRepo.countOwners(workspaceId);
            if (owners <= 1) {
                throw new BadRequestError('Cannot demote the last owner of the workspace');
            }
        }

        const updated = await this.workspaceRepo.updateMemberRole(
            workspaceId,
            targetUserId,
            dto.role as WorkspaceRole,
        );
        await this.invalidateMembersCache(workspaceId);
        return updated;
    }

    async removeMember(workspaceId: string, targetUserId: string): Promise<void> {
        const target = await this.workspaceRepo.findMember(workspaceId, targetUserId);
        if (!target) throw new NotFoundError('Member not found');

        if (target.role === 'OWNER') {
            const owners = await this.workspaceRepo.countOwners(workspaceId);
            if (owners <= 1) {
                throw new BadRequestError('Cannot remove the last owner of the workspace');
            }
        }

        await this.workspaceRepo.removeMember(workspaceId, targetUserId);
        await this.invalidateMembersCache(workspaceId);
        await this.invalidateUserWorkspaceList(targetUserId);
    }

    // --- Cache invalidation helpers ---

    private async invalidateUserWorkspaceList(userId: string): Promise<void> {
        await cacheService.bumpVersion(CACHE_KEYS_WORKSPACE.listVersion(userId));
    }

    private async invalidateWorkspaceCache(workspaceId: string, ownerId: string): Promise<void> {
        await Promise.all([
            cacheService.del(CACHE_KEYS_WORKSPACE.detail(workspaceId)),
            cacheService.del(CACHE_KEYS_WORKSPACE.memberList(workspaceId)),
            cacheService.bumpVersion(CACHE_KEYS_WORKSPACE   .listVersion(ownerId)),
        ]);
    }

    private async invalidateMembersCache(workspaceId: string): Promise<void> {
        await cacheService.del(CACHE_KEYS_WORKSPACE.memberList(workspaceId));
    }
}

import { workspaceRepository } from '@/repositories/index.js';
export const workspaceService = new WorkspaceService(workspaceRepository);