// src/services/reviews.ts
import { reviewApi } from "../lib/api";
import { unwrap } from "../lib/unwrap";

export type ReviewRes = {
    id: string;
    orderId: string;
    rating: number; // 1..5
    comment?: string | null;
    reviewerRole: "BUYER" | "SELLER" | string;
    anonymous: boolean;
    createdAt: string;

    reviewer?: { id: string; displayName: string; avatarUrl?: string | null } | null;
    reviewee?: { id: string; displayName: string; avatarUrl?: string | null } | null;
    product?: { id: string; title?: string | null } | null;
};

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

export type Page<T> = {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
};

export const ReviewsService = {
    /** 我方待评价（含 buyer/seller 列表与统计） */
    async pending(tab: "all" | "buyer" | "seller" | "commented" = "all", page = 0, size = 20) {
        const res = await reviewApi.get("/api/reviews/me/pending", {
            params: { tab, page, size },
        });
        return unwrap<PendingRes>(res.data);
    },

    /** 我写过的“首评”（用于找 reviewId 进行追评） */
    async mineGiven(page = 0, size = 20) {
        const res = await reviewApi.get("/api/reviews/me/given", {
            params: { page, size },
        });
        return unwrap<Page<ReviewRes>>(res.data);
    },

    /** 对某个订单创建首评 */
    async create(req: { orderId: string; rating: number; comment?: string; isAnonymous?: boolean }) {
        const res = await reviewApi.post("/api/reviews", req);
        return unwrap<ReviewRes>(res.data);
    },

    /** 追评 */
    async append(reviewId: string, req: { comment: string }) {
        const res = await reviewApi.post(`/api/reviews/${reviewId}/append`, req);
        return unwrap<void | ReviewRes>(res.data);
    },

    /** 查看某订单的双方评价 */
    async byOrder(orderId: string) {
        const res = await reviewApi.get(`/api/reviews/orders/${orderId}`);
        return unwrap<ReviewRes[]>(res.data);
    },

    /** 查看某用户收到/写出的评价 */
    async listForUser(userId: string, role: "all" | "buyer" | "seller" = "all", page = 0, size = 20) {
        const res = await reviewApi.get(`/api/reviews/users/${userId}`, {
            params: { role, page, size },
        });
        return unwrap<Page<ReviewRes>>(res.data);
    },

    // [FIX] 统一的待评价计数（兼容不同返回结构）
    async countPending(role: "buyer" | "seller"): Promise<number> {
        try {
            // —— 优先：与你“待评价页面”一致，调用 pending("all") 读取聚合 counts ——
            if (typeof (this as any).pending === "function") {
                const all = await (this as any).pending("all", 0, 9999);
                const c = all?.counts as any;
                if (c && (role in c)) {
                    const n = Number(c[role]);
                    if (!Number.isNaN(n)) return n;             // [FIX] 直接返回聚合计数
                }
                // 如果 counts 不存在，兜底用列表长度
                if (role === "buyer" && Array.isArray(all?.buyer)) return all.buyer.length;
                if (role === "seller" && Array.isArray(all?.seller)) return all.seller.length;
            }

            // —— 次优：某些实现 tab=role 才返回列表/分页 ——
            if (typeof (this as any).pending === "function") {
                const pg = await (this as any).pending(role, 0, 1);
                if (pg?.counts && (role in (pg as any).counts)) {
                    const n = Number((pg as any).counts[role]);
                    if (!Number.isNaN(n)) return n;             // [FIX] 也支持这种返回形式
                }
                if (typeof pg?.totalElements === "number") return pg.totalElements;
                if (Array.isArray(pg?.content)) return pg.content.length;
                if (role === "buyer" && Array.isArray(pg?.buyer)) return pg.buyer.length;
                if (role === "seller" && Array.isArray(pg?.seller)) return pg.seller.length;
            }

            // —— 兼容：若你项目拆成 pendingBuyer/pendingSeller ——
            if (role === "buyer" && typeof (this as any).pendingBuyer === "function") {
                const pb = await (this as any).pendingBuyer(0, 1);
                if (typeof pb?.totalElements === "number") return pb.totalElements;
                if (Array.isArray(pb?.content)) return pb.content.length;
                if (Array.isArray(pb)) return pb.length;
            }
            if (role === "seller" && typeof (this as any).pendingSeller === "function") {
                const ps = await (this as any).pendingSeller(0, 1);
                if (typeof ps?.totalElements === "number") return ps.totalElements;
                if (Array.isArray(ps?.content)) return ps.content.length;
                if (Array.isArray(ps)) return ps.length;
            }

            return 0;
        } catch {
            return 0;
        }
    },
};

export default ReviewsService;
