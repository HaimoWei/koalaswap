// src/services/users.ts
import { userApi } from "../lib/api";
import { unwrap } from "../lib/unwrap";
import type { ApiResponse } from "../lib/types";

export type UserBrief = { id: string; displayName: string; avatarUrl?: string | null };

export const UsersService = {
    async getBriefs(ids: string[]): Promise<Record<string, UserBrief>> {
        if (!ids?.length) return {};
        const res = await userApi.get<ApiResponse<UserBrief[]>>("/api/users/brief", { params: { ids: ids.join(",") } });
        const arr = unwrap(res.data) ?? [];
        const map: Record<string, UserBrief> = {};
        for (const u of arr) map[u.id] = u;
        return map;
    },
    async getBrief(id: string): Promise<UserBrief | null> {
        const map = await this.getBriefs([id]);
        return map[id] ?? null;
    },
};
export default UsersService;
