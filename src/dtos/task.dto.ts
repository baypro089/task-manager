import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(500),
  description: z.string().trim().max(10000).optional(),
  statusId: z.string().uuid(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().datetime().nullable().optional(),  // ISO string
  parentId: z.string().uuid().nullable().optional(),      // subtask
});

export type CreateTaskDto = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(500).optional(),
    description: z.string().trim().max(10000).nullable().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    dueDate: z.string().datetime().nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field must be provided' });

export type UpdateTaskDto = z.infer<typeof updateTaskSchema>;

/**
 * Kéo thả task trong kanban.
 * - statusId: cột đích
 * - prevTaskId: task sẽ nằm NGAY TRÊN (null = lên đầu cột)
 * - nextTaskId: task sẽ nằm NGAY DƯỚI (null = xuống cuối cột)
 */
export const moveTaskSchema = z.object({
  statusId: z.string().uuid(),
  prevTaskId: z.string().uuid().nullable().default(null),
  nextTaskId: z.string().uuid().nullable().default(null),
});

export type MoveTaskDto = z.infer<typeof moveTaskSchema>;

export const queryTaskSchema = z.object({
  statusId: z.string().uuid().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  search: z.string().trim().optional(),
  includeSubtasks: z.coerce.boolean().default(false),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export type QueryTaskDto = z.infer<typeof queryTaskSchema>;