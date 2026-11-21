import { z } from 'zod';

export const createWorkspaceSchema = z.object({
    name: z.string().trim().min(1).max(100),
    slug: z
        .string()
        .trim()
        .min(1)
        .max(100)
        .regex(/^[a-z0-9-]+$/, 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang')
        .optional(),
});

export type CreateWorkspaceDto = z.infer<typeof createWorkspaceSchema>;


export const updateWorkspaceSchema = z
    .object({
        name: z.string().trim().min(1).max(100).optional(),
    })
    .refine((d) => Object.keys(d).length > 0, { message: 'At least one field must be provided' });

export type UpdateWorkspaceDto = z.infer<typeof updateWorkspaceSchema>;


export const inviteMemberSchema = z.object({
    email: z.string().email(),
    role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER'),
});

export type InviteMemberDto = z.infer<typeof inviteMemberSchema>;


export const updateRoleSchema = z.object({
    role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']),
});

export type UpdateRoleDto = z.infer<typeof updateRoleSchema>;