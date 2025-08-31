import { reviewApi } from "./http";
import type { ApiResponse, Page } from "./types";

// 评价模型（根据你后端描述，尽量宽松）
export type ReviewRes = {
    id: string;
    orderId: string;
    productId: string;
    fromUserId: string; // 谁写的
    toUserId: string;   // 写给谁
    rating: number;     // 1~5
    content: string;
    anonymous?: boolean;
    createdAt: string;
    appends?: { id: string; content: string; createdAt: string }[];
};

// 待评价项（尽量兼容：可能是订单/商品的简要）
export type PendingItem = {
    orderId: string;
    productId?: string;
    title?: string;     // 如果后端返回商品标题
    image?: string;     // 如果后端返回封面
    createdAt?: string;
    role?: "buyer" | "seller";
};

// 待评价列表响应有时不是 Page，这里做兼容
export type PendingRes =
    | { items: PendingItem[]; total?: number } // 非分页
    | Page<PendingItem>;                       // 分页

// --- APIs ---

// 待评价
export async function getPendingReviews(params: {
    tab: "buyer" | "seller" | "commented";
    page?: number; size?: number;
}) {
    const { tab, page = 0, size = 20 } = params;
    const { data } = await reviewApi.get<ApiResponse<PendingRes>>("/api/reviews/pending", {
        params: { tab, page, size },
    });
    if (!data.ok || !data.data) throw new Error(data.message || "Fetch pending failed");
    return data.data;
}

// 我写过的评价（分页）
export async function getMyReviews(params: { page?: number; size?: number }) {
    const { page = 0, size = 20 } = params || {};
    const { data } = await reviewApi.get<ApiResponse<Page<ReviewRes>>>("/api/reviews/me/given", {
        params: { page, size },
    });
    if (!data.ok || !data.data) throw new Error(data.message || "Fetch my reviews failed");
    return data.data;
}

// 写评价
export async function createReview(payload: {
    orderId: string;
    rating: number;
    content: string;
    anonymous?: boolean;
}) {
    const { data } = await reviewApi.post<ApiResponse<ReviewRes>>("/api/reviews", payload);
    if (!data.ok || !data.data) throw new Error(data.message || "Create review failed");
    return data.data;
}

// 追评
export async function appendReview(id: string, content: string) {
    const { data } = await reviewApi.post<ApiResponse<ReviewRes>>(`/api/reviews/${id}/append`, { content });
    if (!data.ok || !data.data) throw new Error(data.message || "Append review failed");
    return data.data;
}
