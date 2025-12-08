// src/services/home.ts
import { productApi } from "../lib/api";
import { unwrap } from "../lib/unwrap";
import type { ApiResponse, Page as SpringPage } from "../lib/types";

type UiPage<T> = {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
};

function toUiPage<T>(pg: SpringPage<T>): UiPage<T> {
    const page =
        (pg as any).number ??
        (pg as any).page ??
        0;
    const size =
        (pg as any).size ??
        (pg as any).pageSize ??
        10;
    const totalElements =
        (pg as any).totalElements ??
        (pg as any).total ?? 0;
    const totalPages =
        (pg as any).totalPages ??
        Math.max(1, Math.ceil(totalElements / Math.max(1, size)));
    const content = (pg as any).content ?? [];
    return { content, page, size, totalElements, totalPages };
}

export const HomeService = {
    async list(params?: { page?: number; size?: number; sort?: string }) {
        const { page = 0, size = 10, sort = "createdAt,desc" } = params ?? {};
        const { data } = await productApi.get<ApiResponse<SpringPage<any>>>(
            "/api/products/home",
            { params: { page, size, sort } }
        );
        const springPage = unwrap<SpringPage<any>>(data);
        return toUiPage<any>(springPage);
    },
};

export default HomeService;
