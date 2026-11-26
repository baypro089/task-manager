export const TASK_COUNT_INCLUDE = {
    _count: { select: { subtasks: true, assignees: true, comments: true } },
} as const;