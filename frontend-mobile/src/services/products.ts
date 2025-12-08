// src/services/products.ts
import { ENV } from "../lib/env";
import { productApi } from "../lib/api";
import { unwrap } from "../lib/unwrap";
import type { ApiResponse, Page as SpringPage } from "../lib/types";

export type ListParams = {
    page?: number;
    size?: number;
    keyword?: string;
    excludeSellerId?: string;
    sort?: string;
    catId?: number;
    minPrice?: number;
    maxPrice?: number;
};

type UiPage<T> = {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
};

function adaptProduct(p: any) {
    return {
        id: p.id,
        sellerId: p.sellerId,
        title: p.title,
        description: p.description,
        price: Number(p.price),
        currency: p.currency,
        categoryId: p.categoryId ?? null,
        condition: p.condition,
        status: p.status, // ← 只用状态机
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        images: Array.isArray(p.images)
            ? p.images.map((url: string, i: number) => ({ id: `${p.id}_img_${i}`, imageUrl: url, sortOrder: i }))
            : [],
    };
}

function adaptPage(p: any): UiPage<any> {
    return {
        content: (p.content || []).map(adaptProduct),
        page: p.number ?? 0,
        size: p.size ?? ((p.content || []).length),
        totalElements: p.totalElements ?? 0,
        totalPages: p.totalPages ?? 0,
    };
}

export const ProductService = {
    async list(params: ListParams = {}): Promise<UiPage<any>> {
        if (ENV.USE_MOCKS) throw new Error("mocks not supported in this build");
        const qp: any = {
            kw: params.keyword || undefined,
            page: params.page ?? 0,
            size: params.size ?? 10,
            sort: params.sort,
            catId: params.catId,
            minPrice: params.minPrice,
            maxPrice: params.maxPrice,
            excludeSellerId: params.excludeSellerId,
        };
        const res = await productApi.get<ApiResponse<SpringPage<any>>>("/api/products", { params: qp });
        return adaptPage(unwrap(res.data));
    },

    /** 我的发布：tab = "onsale" | "hidden" */
    async listMine(tab: "onsale" | "hidden" = "onsale", page = 0, size = 20, sort = "createdAt,desc") {
        const res = await productApi.get<ApiResponse<SpringPage<any>>>("/api/products/mine", {
            params: { tab, page, size, sort },
        });
        return adaptPage(unwrap(res.data));
    },

    async getById(id: string) {
        const res = await productApi.get<ApiResponse<any>>(`/api/products/${id}`);
        return adaptProduct(unwrap(res.data));
    },

    async create(payload: any) {
        const images = Array.isArray(payload.images)
            ? payload.images.map((x: any) => (typeof x === "string" ? x : x?.imageUrl)).filter(Boolean)
            : (payload.imageUrl ? [payload.imageUrl] : []);
        const body = {
            title: payload.title,
            description: payload.description,
            price: payload.price,
            currency: payload.currency || "AUD",
            categoryId: payload.categoryId ?? null,
            condition: payload.condition || "GOOD",
            images,
            status: payload.status, // 可选：若为空后端默认 ACTIVE
        };
        const res = await productApi.post<ApiResponse<any>>("/api/products", body);
        return adaptProduct(unwrap(res.data));
    },

    async update(id: string, patch: any) {
        const hasImages = Array.isArray(patch.images) || typeof patch.imageUrl === "string";
        const images = hasImages
            ? (Array.isArray(patch.images)
                ? patch.images.map((x: any) => (typeof x === "string" ? x : x?.imageUrl)).filter(Boolean)
                : [patch.imageUrl])
            : undefined;
        const body: any = {
            title: patch.title,
            description: patch.description,
            price: patch.price,
            currency: patch.currency,
            categoryId: patch.categoryId,
            condition: patch.condition,
            images,
            status: patch.status, // ← 使用状态机
        };
        const res = await productApi.patch<ApiResponse<any>>(`/api/products/${id}`, body);
        return adaptProduct(unwrap(res.data));
    },

    /** 软下架（HIDDEN） */
    async hide(id: string) {
        await productApi.delete<ApiResponse<void>>(`/api/products/${id}`); // hard=false 默认
        return { ok: true };
    },

    /** 硬删除（仅 HIDDEN，可失败：有订单记录会被拒绝） */
    async removeHard(id: string) {
        await productApi.delete<ApiResponse<void>>(`/api/products/${id}`, { params: { hard: true } });
        return { ok: true };
    },

    async relist(id: string, token?: string) {
        // 如果你们有全局拦截器加 Bearer，这里不必手动塞 token
        const res = await productApi.post<ApiResponse<void>>(`/api/products/${id}/relist`);
        return { ok: true };
    },
};

export default ProductService;
