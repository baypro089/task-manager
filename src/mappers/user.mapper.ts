import type { UserResponse } from '@/responses/user.response.js';
import type { User } from '@prisma/client';
export class UserMapper {
    static toResponse(user: User): UserResponse {
        const { passwordHash, ...rest } = user;
        return rest;
    }

    static toResponseList(users: User[]): UserResponse[] {
        return users.map(user => this.toResponse(user));
    }
}