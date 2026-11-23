import type { QueryUserDto } from '@/dtos/user.dtos.js';
import type { User, Prisma } from '@/generated/prisma/client.js';
export interface IUserRepository {
    findAll(): Promise<User[]>;
    findMany(query: {
        page: number, pageSize: number, search?: string,
        sortBy: string, sortOrder: 'asc' | 'desc', isActive?: boolean
    }): Promise<{ items: User[], total: number }>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    create(data: Prisma.UserCreateInput): Promise<User>;
    update(id: string, data: Prisma.UserUpdateInput): Promise<User>;
    delete(id: string): Promise<void>;
}
