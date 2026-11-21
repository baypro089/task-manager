import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(100),
  avatarUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
});

export type CreateUserDto = z.infer<typeof createUserSchema>

export const updateUserSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateUserDto = z.infer<typeof updateUserSchema>;

export const queryUserSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  sortBy: z.enum(['createdAt', 'email', 'displayName']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  isActive: z.coerce.boolean().optional(),
});

export type QueryUserDto = z.infer<typeof queryUserSchema>;