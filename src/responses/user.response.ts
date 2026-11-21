import type { PageResult } from "@/types/page.type.js";

export type UserResponse = {
    id: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
}

export type PagedUserResponse = PageResult<UserResponse>;
