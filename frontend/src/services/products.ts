// src/services/products.ts
import { ENV } from "../lib/env";
import {
    mockListProducts,
    mockGetProduct,
    mockCreateProduct,
    mockUpdateProduct,
    mockDeleteProduct,
    mockListMyProducts,
    mockDiscount,
} from "../mocks/products";

export type ListParams = { page?: number; size?: number; keyword?: string; excludeSellerId?: string };
export type Page<T> = {
    content: T[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
};

export const ProductService = {
    async list(params: ListParams = {}): Promise<Page<any>> {
        if (ENV.USE_MOCKS) return mockListProducts(params);
        throw new Error("TODO: GET /api/products");
    },

    async getById(id: string) {
        if (ENV.USE_MOCKS) return mockGetProduct(id);
        throw new Error("TODO: GET /api/products/:id");
    },

    async listMine(token: string) {
        if (ENV.USE_MOCKS) return mockListMyProducts(token);
        throw new Error("TODO: GET /api/me/products");
    },

    async create(token: string, payload: any) {
        if (ENV.USE_MOCKS) return mockCreateProduct(token, payload);
        throw new Error("TODO: POST /api/products");
    },

    async update(token: string, id: string, patch: any) {
        if (ENV.USE_MOCKS) return mockUpdateProduct(token, id, patch);
        throw new Error("TODO: PATCH /api/products/:id");
    },

    async updatePrice(id: string, price: number, token: string) {
        if (ENV.USE_MOCKS) return mockUpdateProduct(token, id, { price });
        throw new Error("TODO");
    },

    async unlist(id: string, token: string) {
        if (ENV.USE_MOCKS) return mockUpdateProduct(token, id, { isActive: false });
        throw new Error("TODO");
    },

    async relist(id: string, token: string) {
        if (ENV.USE_MOCKS) return mockUpdateProduct(token, id, { isActive: true });
        throw new Error("TODO");
    },

    async discount(token: string, id: string, delta: number) {
        if (ENV.USE_MOCKS) return mockDiscount(token, id, delta);
        throw new Error("TODO");
    },

    async remove(token: string, id: string) {
        if (ENV.USE_MOCKS) return mockDeleteProduct(token, id);
        throw new Error("TODO: DELETE /api/products/:id");
    },
};

export default ProductService;
