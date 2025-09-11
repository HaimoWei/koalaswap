// src/api/users.ts
import { userApi } from "./http";
import type { ApiResponse } from "./types";

// 与后端 DTO 对齐
export type UserBriefRes = { id: string; displayName: string; avatarUrl?: string | null };

/** 单个用户简介（真实接口：GET /api/users/{id}/brief） */
export async function getUserBrief(id: string) {
    const { data } = await userApi.get<ApiResponse<UserBriefRes>>(`/api/users/${id}/brief`);
    if (!data.ok || !data.data) throw new Error(data.message || "User not found");
    return data.data;
}

/** 保留 getUserPublic 的名义，内部仅走 brief（不再调用不存在的接口） */
export type PublicUser = {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
    // 预留（后端暂未提供，不展示也不影响页面）
    bio?: string | null;
    stats?: { totalSold?: number; totalListings?: number };
};

export async function getUserPublic(id: string): Promise<PublicUser> {
    const brief = await getUserBrief(id);
    return {
        id: brief.id,
        displayName: brief.displayName,
        avatarUrl: brief.avatarUrl ?? null,
    };
}
