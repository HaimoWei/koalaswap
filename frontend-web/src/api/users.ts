import { userApi } from "./http";
import type { ApiResponse } from "./types";

// 卖家/用户简要信息
export type UserBriefRes = { id: string; displayName: string; avatarUrl?: string | null };

export async function getUserBrief(id: string) {
    const { data } = await userApi.get<ApiResponse<UserBriefRes>>(`/api/users/${id}/brief`);
    if (!data.ok || !data.data) throw new Error(data.message || "User not found");
    return data.data;
}
