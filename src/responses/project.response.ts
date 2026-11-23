export interface ProjectResponse {
    id: string;
    workspaceId: string;
    name: string;
    description: string | null;
    color: string | null;
    isArchived: boolean;
    createdById: string;
    createdAt: string;
    updatedAt: string;
}

export interface ProjectWithCountsResponse extends ProjectResponse {
    counts: {
        tasks: number;
        statuses: number;
    };
}

export interface ProjectWithStatusesResponse extends ProjectResponse {
    statuses: TaskStatusResponse[];
}

export interface TaskStatusResponse {
    id: string;
    projectId: string;
    name: string;
    position: number;
    isDone: boolean;
    createdAt: string;
}