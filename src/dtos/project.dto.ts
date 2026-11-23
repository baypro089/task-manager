import { z } from 'zod';

export const createProjectSchema = z.object({
    name: z.string().trim().min(1).max(200),
    description: z.string().trim().max(5000).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be hex #RRGGBB').optional(),
});

export type CreateProjectDto = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z
    .object({
        name: z.string().trim().min(1).max(200).optional(),
        description: z.string().trim().max(5000).nullable().optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
    })
    .refine((d) => Object.keys(d).length > 0, { message: 'At least one field must be provided' });

export type UpdateProjectDto = z.infer<typeof updateProjectSchema>;

export const queryProjectSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    includeArchived: z.coerce.boolean().default(false),
});

export type QueryProjectDto = z.infer<typeof queryProjectSchema>;