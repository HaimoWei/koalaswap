// src/api/reviews.ts
import { reviewApi } from "./http";
import type { ApiResponse, Page } from "./types";

/** 与后端 ReviewRes / AppendBrief 对齐（含追评） */
export type SellerReview = {
    id: string;
    orderId: string;
    rating: number;                 // 1..5
    comment?: string | null;
    reviewerRole?: string;
    anonymous?: boolean;
    createdAt?: string;

    reviewer?: { id: string; displayName: string; avatarUrl?: string | null } | null;
    reviewee?: { id: string; displayName: string; avatarUrl?: string | null } | null;
    product?: { id: string; title?: string | null } | null;

    appends?: Array<{
        id: string;
        comment?: string | null;
        createdAt?: string;
        reviewer?: { id: string; displayName: string; avatarUrl?: string | null } | null;
        anonymous?: boolean;
    }>;
};

// 为了兼容老页面的命名，导出一个别名
export type ReviewRes = SellerReview;

/** —— 待评价 DTO：与后端 PendingRes 对齐 ——
 * buyer: Item[], seller: Item[], counts
 */
export type PendingCounts = { buyer: number; seller: number; commented: number };

export type PendingItem = {
    tab: "buyer" | "seller" | "commented";
    orderId: string;
    productId: string;
    closedAt?: string | null;
    counterpart: { id: string; displayName: string; avatarUrl?: string | null };
    product: { id: string; title?: string | null };
};

export type PendingRes = {
    buyer: PendingItem[];
    seller: PendingItem[];
    counts: PendingCounts;
};

/** 卖家主页评价列表（公开）：
 * GET /api/reviews/users/{userId}?role=...&page=&size=&withAppends=true
 */
export async function listUserReviews(
    userId: string,
    opts: { role?: "all" | "buyer" | "seller"; page?: number; size?: number; withAppends?: boolean } = {}
) {
    const { role = "all", page = 0, size = 10, withAppends = true } = opts;
    const { data } = await reviewApi.get<ApiResponse<Page<SellerReview>>>(`/api/reviews/users/${userId}`, {
        params: { role, page, size, withAppends, sort: "createdAt,desc" },
    });
    if (!data.ok || !data.data) throw new Error(data.message || "Fetch user reviews failed");
    return data.data;
}

/** 待评价（需登录）：
 * GET /api/reviews/me/pending?tab=buyer|seller|commented&page=&size=
 */
export async function getPendingReviews(params: {
    tab: "buyer" | "seller" | "commented";
    page?: number;
    size?: number;
}) {
    const { tab, page = 0, size = 20 } = params;
    const { data } = await reviewApi.get<ApiResponse<PendingRes>>("/api/reviews/me/pending", {
        params: { tab, page, size },
    });
    if (!data.ok || !data.data) throw new Error(data.message || "Fetch pending failed");
    return data.data;
}

/** 我写过的首评（进入追评用）：
 * GET /api/reviews/me/given?page=&size=
 */
export async function getMyReviews(params: { page?: number; size?: number } = {}) {
    const { page = 0, size = 20 } = params;
    const { data } = await reviewApi.get<ApiResponse<Page<SellerReview>>>("/api/reviews/me/given", {
        params: { page, size },
    });
    if (!data.ok || !data.data) throw new Error(data.message || "Fetch my reviews failed");
    return data.data;
}

/** 创建首评：
 * POST /api/reviews  body: { orderId, rating, comment?, isAnonymous? }
 */
export async function createReview(payload: {
    orderId: string;
    rating: number;
    comment?: string;
    isAnonymous?: boolean;
}) {
    const { data } = await reviewApi.post<ApiResponse<SellerReview>>("/api/reviews", payload);
    if (!data.ok || !data.data) throw new Error(data.message || "Create review failed");
    return data.data;
}

/** 追评：
 * POST /api/reviews/{reviewId}/append  body: { comment }
 * 兼容：appendReview(id, "内容") 或 appendReview(id, { comment: "内容" })
 */
export async function appendReview(reviewId: string, req: { comment: string }): Promise<void>;
export async function appendReview(reviewId: string, comment: string): Promise<void>;
export async function appendReview(reviewId: string, arg: string | { comment: string }): Promise<void> {
    const body = typeof arg === "string" ? { comment: arg } : arg;
    const { data } = await reviewApi.post<ApiResponse<void>>(`/api/reviews/${reviewId}/append`, body);
    if (!data.ok) throw new Error(data.message || "Append review failed");
}
