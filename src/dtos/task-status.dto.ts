import { z } from 'zod';

export const createStatusSchema = z.object({
    name: z.string().trim().min(1).max(50),
    position: z.number().int().min(0).optional(), // nếu không truyền → append cuối
    isDone: z.boolean().default(false),
});

export type CreateStatusDto = z.infer<typeof createStatusSchema>;

export const updateStatusSchema = z
    .object({
        name: z.string().trim().min(1).max(50).optional(),
        position: z.number().int().min(0).optional(),
        isDone: z.boolean().optional(),
    })
    .refine((d) => Object.keys(d).length > 0, { message: 'At least one field must be provided' });

export type UpdateStatusDto = z.infer<typeof updateStatusSchema>;

