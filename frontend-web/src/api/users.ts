// src/api/users.ts
import { userApi } from "./http";
import type { ApiResponse, MyProfileRes } from "./types";

// 与后端 DTO 对齐
export type UserBriefRes = { id: string; displayName: string; avatarUrl?: string | null };

/** 单个用户简介（真实接口：GET /api/users/{id}/brief） */
export async function getUserBrief(id: string) {
    const { data } = await userApi.get<ApiResponse<UserBriefRes>>(`/api/users/${id}/brief`);
    if (!data.ok || !data.data) throw new Error(data.message || "User not found");
    return data.data;
}

/** 完整的用户公开信息类型 */
export type PublicUser = {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
    bio?: string | null;
    location?: string | null;           // 地理位置
    phoneVerified?: boolean;            // 手机验证状态
    emailVerified?: boolean;            // 邮箱验证状态
    ratingAvg?: number;                 // 平均评分
    ratingCount?: number;               // 评价数量
    memberSince?: string;               // 会员加入日期
    lastActiveAt?: string;              // 最后活跃时间
    createdAt?: string;                 // 注册时间
};

export async function getUserPublic(id: string): Promise<PublicUser> {
    const { data } = await userApi.get<ApiResponse<PublicUser>>(`/api/users/${id}/public`);
    if (!data.ok || !data.data) throw new Error(data.message || "User not found");
    return data.data;
}

// ===== Me related =====

function pickMsg(e: any, fallback: string) {
    return e?.response?.data?.message || e?.message || fallback;
}

/** 修改密码（需登录）：POST /api/users/change-password */
export async function changePassword(currentPassword: string, newPassword: string) {
    try {
        const { data } = await userApi.post<ApiResponse<void>>(
            "/api/users/change-password",
            { currentPassword, newPassword }
        );
        if (!data.ok) throw new Error(data.message || "Change password failed");
        return true;
    } catch (e: any) {
        throw new Error(pickMsg(e, "Change password failed"));
    }
}

/** 更新我的资料（昵称/简介/地区）：PUT /api/users/me */
export async function updateMyProfile(payload: {
    displayName: string;
    bio?: string | null;
    location?: string | null;
}): Promise<MyProfileRes> {
    try {
        const body: any = {
            displayName: payload.displayName,
            bio: payload.bio ?? null,
            location: payload.location ?? null,
        };
        const { data } = await userApi.put<ApiResponse<MyProfileRes>>(
            "/api/users/me",
            body
        );
        if (!data.ok || !data.data) throw new Error(data.message || "Update profile failed");
        return data.data;
    } catch (e: any) {
        throw new Error(pickMsg(e, "Update profile failed"));
    }
}

/** 更新我的头像：PUT /api/users/me/avatar */
export async function updateMyAvatar(avatarUrl: string): Promise<MyProfileRes> {
    try {
        const { data } = await userApi.put<ApiResponse<MyProfileRes>>(
            "/api/users/me/avatar",
            { avatarUrl }
        );
        if (!data.ok || !data.data) throw new Error(data.message || "Update avatar failed");
        return data.data;
    } catch (e: any) {
        throw new Error(pickMsg(e, "Update avatar failed"));
    }
}
