import type { QueryUserDto } from '@/dtos/user.dtos.js';
import type { User } from '@prisma/client';
export interface IUserRepository {
    findAll(): Promise<User[]>;
    findMany(data: QueryUserDto): Promise<{ items: User[], total: number }>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    create(data: Partial<User>): Promise<User>;
    update(id: string, data: Partial<User>): Promise<User>;
    delete(id: string): Promise<void>;
}