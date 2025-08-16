// src/services/products.ts
// src/services/products.ts
import { ENV } from "../lib/env";
import { productApi } from "../lib/api";
import { unwrap } from "../lib/unwrap";
import type { ApiResponse, Page as SpringPage } from "../lib/types";
import {
    mockListProducts, mockGetProduct, mockCreateProduct, mockUpdateProduct, mockDeleteProduct, mockListMyProducts, mockDiscount
} from "../mocks/products";

export type ListParams = {
    page?: number; size?: number; keyword?: string; excludeSellerId?: string;
    sort?: string; catId?: number; minPrice?: number; maxPrice?: number;
};

type UiPage<T> = { content: T[]; page: number; size: number; totalElements: number; totalPages: number };

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
        isActive: p.active,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        images: Array.isArray(p.images) ? p.images.map((url: string, i: number) => ({ id: `${p.id}_img_${i}`, imageUrl: url, sortOrder: i })) : [],
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
        if (ENV.USE_MOCKS) return mockListProducts(params);
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

    async listMine(page = 0, size = 20, sort = "createdAt,desc") {
        if (ENV.USE_MOCKS) return mockListMyProducts("mock");
        const res = await productApi.get<ApiResponse<SpringPage<any>>>("/api/products/mine", { params: { page, size, sort } });
        return adaptPage(unwrap(res.data));
    },

    async getById(id: string) {
        if (ENV.USE_MOCKS) return mockGetProduct(id);
        const res = await productApi.get<ApiResponse<any>>(`/api/products/${id}`);
        return adaptProduct(unwrap(res.data));
    },

    async create(token: string, payload: any) {
        if (ENV.USE_MOCKS) return mockCreateProduct(token, payload);
        const images = Array.isArray(payload.images)
            ? payload.images.map((x: any) => (typeof x === "string" ? x : x?.imageUrl)).filter(Boolean)
            : (payload.imageUrl ? [payload.imageUrl] : []);
        const body = {
            title: payload.title, description: payload.description, price: payload.price,
            currency: payload.currency || "AUD", categoryId: payload.categoryId ?? null, condition: payload.condition || "GOOD", images,
        };
        const res = await productApi.post<ApiResponse<any>>("/api/products", body);
        return adaptProduct(unwrap(res.data));
    },

    async update(token: string, id: string, patch: any) {
        if (ENV.USE_MOCKS) return mockUpdateProduct(token, id, patch);
        const hasImages = Array.isArray(patch.images) || typeof patch.imageUrl === "string";
        const images = hasImages
            ? (Array.isArray(patch.images)
                ? patch.images.map((x: any) => (typeof x === "string" ? x : x?.imageUrl)).filter(Boolean)
                : [patch.imageUrl])
            : undefined;
        const body: any = {
            title: patch.title, description: patch.description, price: patch.price, currency: patch.currency,
            categoryId: patch.categoryId, condition: patch.condition, images,
            active: typeof patch.isActive === "boolean" ? patch.isActive : patch.active,
        };
        const res = await productApi.patch<ApiResponse<any>>(`/api/products/${id}`, body);
        return adaptProduct(unwrap(res.data));
    },

    async updatePrice(id: string, price: number, token: string) { return this.update(token, id, { price }); },
    async unlist(id: string, token: string) { return this.update(token, id, { isActive: false }); },
    async relist(id: string, token: string) { return this.update(token, id, { isActive: true }); },
    async discount(token: string, id: string, delta: number) {
        if (ENV.USE_MOCKS) return mockDiscount(token, id, delta);
        const p = await this.getById(id);
        return this.update(token, id, { price: Math.max(0, (p.price || 0) + delta) });
    },
    async remove(token: string, id: string) {
        if (ENV.USE_MOCKS) return mockDeleteProduct(token, id);
        await productApi.delete<ApiResponse<void>>(`/api/products/${id}`);
        return { ok: true };
    },
};
export default ProductService;
