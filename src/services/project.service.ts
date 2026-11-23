import { createHash } from 'crypto';
import type { IProjectRepository } from '@/repositories/interfaces/project.interface.repository.js';
import type {
    CreateProjectDto,
    UpdateProjectDto,
    QueryProjectDto,
} from '@/dtos/project.dto.js';
import type {
    CreateStatusDto,
    UpdateStatusDto
} from '@/dtos/task-status.dto.js';
import type {
    ProjectResponse,
    ProjectWithCountsResponse,
    ProjectWithStatusesResponse,
    TaskStatusResponse,
} from '@/responses/project.response.js';
import { ProjectMapper } from '@/mappers/project.mapper.js';
import { BadRequestError, ConflictError, NotFoundError } from '@/utils/errors.js';
import { cacheService } from '@/services/cache.service.js';
import { CACHE_KEYS_PROJECT, CACHE_TTL_PROJECT } from '@/configuration/cache.js';
import type { PageResult } from '@/types/page.type.js';

export class ProjectService {
    constructor(private projectRepo: IProjectRepository) { }

    // ---------- Project CRUD ----------

    async createProject(
        workspaceId: string,
        userId: string,
        dto: CreateProjectDto,
    ): Promise<ProjectResponse> {
        const project = await this.projectRepo.createWithDefaultStatuses({
            workspaceId,
            name: dto.name,
            description: dto.description,
            color: dto.color,
            createdById: userId,
        });

        await this.invalidateList(workspaceId);
        return ProjectMapper.toResponse(project);
    }

    async listProjects(
        workspaceId: string,
        query: QueryProjectDto,
    ): Promise<PageResult<ProjectWithCountsResponse>> {
        const queryHash = createHash('md5')
            .update(JSON.stringify({ ...query, workspaceId }))
            .digest('hex');
        const version = await cacheService.getVersion(CACHE_KEYS_PROJECT.listVersion(workspaceId));
        const key = CACHE_KEYS_PROJECT.list(workspaceId, version, queryHash);

        return cacheService.getOrSet(key, CACHE_TTL_PROJECT.PROJECT_LIST, async () => {
            const { items, total } = await this.projectRepo.findManyByWorkspace(workspaceId, query);
            return {
                data: ProjectMapper.toWithCountsList(items),
                total,
                page: query.page || 1,
                pageSize: query.pageSize || 10,
                totalPages: Math.ceil(total / (query.pageSize || 10)),
                previousPage: (query.page || 1) > 1,
                nextPage: (query.page || 1) * (query.pageSize || 10) < total,
            };
        });
    }

    async getProject(projectId: string): Promise<ProjectWithStatusesResponse> {
        const key = CACHE_KEYS_PROJECT.detail(projectId);
        return cacheService.getOrSet(key, CACHE_TTL_PROJECT.PROJECT_DETAIL, async () => {
            const project = await this.projectRepo.findByIdWithStatuses(projectId);
            if (!project) throw new NotFoundError('Project not found');
            return ProjectMapper.toWithStatuses(project);
        });
    }

    async updateProject(
        projectId: string,
        dto: UpdateProjectDto,
    ): Promise<ProjectResponse> {
        const project = await this.projectRepo.findById(projectId);
        if (!project) throw new NotFoundError('Project not found');

        const updated = await this.projectRepo.update(projectId, dto);
        await this.invalidateAll(projectId, project.workspaceId);
        return ProjectMapper.toResponse(updated);
    }

    async archiveProject(projectId: string): Promise<ProjectResponse> {
        const project = await this.projectRepo.findById(projectId);
        if (!project) throw new NotFoundError('Project not found');

        const updated = await this.projectRepo.archive(projectId);
        await this.invalidateAll(projectId, project.workspaceId);
        return ProjectMapper.toResponse(updated);
    }

    async deleteProject(projectId: string): Promise<void> {
        const project = await this.projectRepo.findById(projectId);
        if (!project) throw new NotFoundError('Project not found');

        await this.projectRepo.delete(projectId);
        await this.invalidateAll(projectId, project.workspaceId);
    }

    // ---------- TaskStatus CRUD ----------

    async listStatuses(projectId: string): Promise<TaskStatusResponse[]> {
        const key = CACHE_KEYS_PROJECT.statuses(projectId);
        return cacheService.getOrSet(key, CACHE_TTL_PROJECT.STATUSES, async () => {
            const statuses = await this.projectRepo.findStatusesByProjectId(projectId);
            return ProjectMapper.toStatusResponseList(statuses);
        });
    }

    async createStatus(projectId: string, dto: CreateStatusDto): Promise<TaskStatusResponse> {
        // Position mặc định: append cuối
        let position = dto.position;
        if (position === undefined) {
            const statuses = await this.projectRepo.findStatusesByProjectId(projectId);
            position = statuses.length;
        }

        // Unique constraint sẽ chặn trùng tên, nhưng trả lỗi rõ hơn
        const existing = await this.projectRepo.findStatusesByProjectId(projectId);
        if (existing.some((s) => s.name === dto.name)) {
            throw new ConflictError('Status name already exists in this project');
        }

        const created = await this.projectRepo.createStatus(projectId, {
            name: dto.name,
            position,
            isDone: dto.isDone,
        });
        await this.invalidateStatuses(projectId);
        return ProjectMapper.toStatusResponse(created);
    }

    async updateStatus(
        projectId: string,
        statusId: string,
        dto: UpdateStatusDto,
    ): Promise<TaskStatusResponse> {
        const status = await this.projectRepo.findStatusById(statusId);
        if (!status || status.projectId !== projectId) {
            throw new NotFoundError('Status not found');
        }

        const updated = await this.projectRepo.updateStatus(statusId, dto);
        await this.invalidateStatuses(projectId);
        await this.invalidateDetail(projectId); // vì detail include statuses
        return ProjectMapper.toStatusResponse(updated);
    }

    async deleteStatus(projectId: string, statusId: string): Promise<void> {
        const status = await this.projectRepo.findStatusById(statusId);
        if (!status || status.projectId !== projectId) {
            throw new NotFoundError('Status not found');
        }

        // Không cho xóa nếu còn task đang dùng
        const taskCount = await this.projectRepo.countTasksByStatus(statusId);
        if (taskCount > 0) {
            throw new BadRequestError(
                `Cannot delete status: ${taskCount} task(s) are still using it`,
            );
        }

        await this.projectRepo.deleteStatus(statusId);
        await this.invalidateStatuses(projectId);
        await this.invalidateDetail(projectId);
    }

    // ---------- Cache helpers ----------

    private async invalidateList(workspaceId: string): Promise<void> {
        await cacheService.bumpVersion(CACHE_KEYS_PROJECT.listVersion(workspaceId));
    }

    private async invalidateDetail(projectId: string): Promise<void> {
        await cacheService.del(CACHE_KEYS_PROJECT.detail(projectId));
    }

    private async invalidateStatuses(projectId: string): Promise<void> {
        await cacheService.del(CACHE_KEYS_PROJECT.statuses(projectId));
    }

    private async invalidateAll(projectId: string, workspaceId: string): Promise<void> {
        await Promise.all([
            cacheService.del(CACHE_KEYS_PROJECT.detail(projectId)),
            cacheService.del(CACHE_KEYS_PROJECT.statuses(projectId)),
            cacheService.bumpVersion(CACHE_KEYS_PROJECT.listVersion(workspaceId)),
        ]);
    }
}

import { projectRepository } from '@/repositories/index.js';
export const projectService = new ProjectService(projectRepository);