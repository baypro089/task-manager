import type { UserResponse } from '@/responses/user.response.js';
import type { User } from '@/generated/prisma/client.js';

export const UserMapper = {
    toResponse(user: User): UserResponse {
        const { passwordHash, ...safe } = user;
        return { ...safe, createdAt: user.createdAt.toISOString(), updatedAt: user.updatedAt.toISOString() };
    },

    toResponseList(users: User[]): UserResponse[] {
        return users.map(UserMapper.toResponse);
    }
}