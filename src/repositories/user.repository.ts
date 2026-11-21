import { prisma } from '@/configuration/prisma.js';
import type { QueryUserDto } from '@/dtos/user.dtos.js';
import type { Prisma } from '@/generated/prisma/browser.js';
import type { IUserRepository } from '@/repositories/interfaces/user.repository.interface.js';
import type { User } from '@prisma/client';

export class UserRepository implements IUserRepository {
    async findAll(): Promise<User[]> {
        return prisma.user.findMany();
    }

    async findMany(query: QueryUserDto): Promise<{ items: User[], total: number }> {

        const { page, pageSize, search, sortBy, sortOrder, isActive } = query;

        const where: Prisma.UserWhereInput = {
            ...(isActive !== undefined && { isActive }),
            ...(search && {
                OR: [
                    { email: { contains: search, mode: 'insensitive' } },
                    { displayName: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };

        const currentPage = Math.max(1, Math.floor(page || 1));
        const currentPageSize = Math.max(1, Math.floor(pageSize || 10));
        const skip = (currentPage - 1) * currentPageSize;

        const [data, total] = await prisma.$transaction([
            prisma.user.findMany({
                where,
                skip,
                take: currentPageSize,
                orderBy: { [sortBy]: sortOrder },
            }),
            prisma.user.count({ where }),
        ]);

        return {
            items: data,
            total,
        };
    }

    async update(id: string, data: Partial<User>): Promise<User> {
        return prisma.user.update({ where: { id }, data });
    }

    async delete(id: string): Promise<void> {
        await prisma.user.delete({ where: { id } });
    }
    async findByEmail(email: string): Promise<User | null> {
        return prisma.user.findUnique({ where: { email } });
    }

    async findById(id: string): Promise<User | null> {
        return prisma.user.findUnique({ where: { id } });
    }

    async create(data: Partial<User>): Promise<User> {
        return prisma.user.create({ data });
    }
}