import type { CreateUserDto, QueryUserDto, UpdateUserDto } from "@/dtos/user.dtos.js";
import type { User } from "@/generated/prisma/browser.js";
import type { IUserRepository } from "@/repositories/interfaces/user.repository.interface.js";
import { BadRequestError, NotFoundError } from "@/utils/errors.js";
import { hashPassword } from "@/utils/password.js";
import { UserMapper } from "@/mappers/user.mapper.js";

export class UserService {
    constructor(private userRepository: IUserRepository) { }

    async getUserById(id: string): Promise<UserResponse | null> {
        const key = CACHE_KEYS_USER.userDetail(id);
        const user = await cacheService.getOrSet(key, CACHE_TTL_USER.USER_DETAIL, () =>
            this.userRepository.findById(id),
        );
        if (!user) throw new NotFoundError('User not found');
        return UserMapper.toResponse(user as User);
    }

    async getAllUsers(): Promise<User[]> {
        return this.userRepository.findAll();
    }

    async getAllUsersWithPage(query: QueryUserDto): Promise<PageResult<UserResponse>> {
        const queryHash = createHash('md5').update(JSON.stringify(query)).digest('hex');
        const version = await cacheService.getVersion(CACHE_KEYS_USER.userListVersion);
        const key = CACHE_KEYS_USER.userList(version, queryHash);

        return cacheService.getOrSet(key, CACHE_TTL_USER.USER_LIST, async () => {
            const { items, total } = await this.userRepository.findMany(query);
            return {
                data: UserMapper.toResponseList(items),
                total,
                page: query.page || 1,
                pageSize: query.pageSize || 10,
                totalPages: Math.ceil(total / (query.pageSize || 10)),
                previousPage: (query.page || 1) > 1,
                nextPage: (query.page || 1) * (query.pageSize || 10) < total,
            };
        });
    }

    async createUser(data: CreateUserDto): Promise<UserResponse> {
        const defaultPassword = hashPassword("123456");
        const passwordHash = await defaultPassword;
        const user = await this.userRepository.create({ ...data, passwordHash });
        await this.invalidateUserCache(user.id);
        return UserMapper.toResponse(user);
    }

    async updateUser(id: string, data: UpdateUserDto): Promise<UserResponse> {
        const existingUser = await this.userRepository.findById(id);
        if (!existingUser) {
            throw new BadRequestError("User not found");
        }
        const updated = await this.userRepository.update(id, data);
        await this.invalidateUserCache(updated.id);
        return UserMapper.toResponse(updated);
    }

    async deleteUser(id: string): Promise<void> {
        const existingUser = await this.userRepository.findById(id);
        if (!existingUser) {
            throw new BadRequestError("User not found");
        }
        await this.invalidateUserCache(existingUser.id);
        await this.userRepository.delete(id);
    }

    /**
     * Xóa cache sau khi write.
     */
    private async invalidateUserCache(id: string): Promise<void> {
        await Promise.all([
            cacheService.del(CACHE_KEYS_USER.userDetail(id)),   // Xóa detail
            cacheService.bumpVersion(CACHE_KEYS_USER.userListVersion), // Xóa toàn bộ list
        ]);
    }
}

import { userRepository } from "@/repositories/index.js";
import type { UserResponse } from "@/responses/user.response.js";
import { CACHE_KEYS_USER, CACHE_TTL_USER } from "@/configuration/cache.js";
import { cacheService } from "./cache.service.js";
import { createHash } from "crypto";
import type { PageResult } from "@/types/page.type.js";
export const userService = new UserService(userRepository);