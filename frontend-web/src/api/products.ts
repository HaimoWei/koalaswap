// src/api/products.ts
import { productApi } from "./http";
import type { Page, ProductRes, ApiResponse } from "./types";
import { DEBUG, dlog } from "../debug";

type MaybeWrapped<T> = ApiResponse<T> | T;

function unwrap<T>(payload: MaybeWrapped<T>): T {
    if (payload && typeof payload === "object" && "ok" in (payload as any)) {
        const p = payload as ApiResponse<T>;
        if (!p.ok) {
            if (DEBUG) dlog("API unwrap failed", p);
            throw new Error(p.message || "Request failed");
        }
        return p.data as T;
    }
    return payload as T;
}

/** 首页推荐/瀑布流 */
export async function fetchHomeProducts(
    { page = 0, size = 20, sort = "createdAt,desc" }: { page?: number; size?: number; sort?: string }
) {
    const { data } = await productApi.get<MaybeWrapped<Page<ProductRes>>>(
        "/api/products/home",
        { params: { page, size, sort } }
    );
    return unwrap<Page<ProductRes>>(data);
}

/** 搜索 + 筛选 */
export type SearchParams = {
    page?: number;
    size?: number;
    keyword?: string;
    catId?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
};

export async function searchProducts(params: SearchParams) {
    const {
        page = 0, size = 20, keyword, catId, minPrice, maxPrice, sort = "createdAt,desc",
    } = params;

    const { data } = await productApi.get<MaybeWrapped<Page<ProductRes>>>(
        "/api/products",
        { params: { page, size, keyword, catId, minPrice, maxPrice, sort } }
    );
    return unwrap<Page<ProductRes>>(data);
}

/** 我发布的（在售/隐藏） */
export async function fetchMyProducts(
    { tab = "onsale", page = 0, size = 20, sort = "updatedAt,desc" }:
        { tab?: "onsale" | "hidden"; page?: number; size?: number; sort?: string }
) {
    const { data } = await productApi.get<MaybeWrapped<Page<ProductRes>>>(
        "/api/products/mine",
        { params: { tab, page, size, sort } }
    );
    return unwrap<Page<ProductRes>>(data);
}

/** 详情 */
export async function getProduct(id: string) {
    const { data } = await productApi.get<MaybeWrapped<ProductRes>>(`/api/products/${id}`);
    return unwrap<ProductRes>(data);
}

/** 收藏状态查询（404/401 → 未收藏，不打断渲染） */
export async function checkFavorite(productId: string) {
    try {
        const { data } = await productApi.get<MaybeWrapped<{ favorited: boolean } | boolean>>(
            `/api/favorites/check`,
            { params: { productId } }
        );
        const res: any = unwrap<any>(data);
        if (typeof res === "boolean") return res;
        return !!res?.favorited;
    } catch (e: any) {
        if (e?.response?.status === 401 || e?.response?.status === 404) return false;
        return false;
    }
}

/** 添加收藏 */
export async function addFavorite(productId: string) {
    const { data } = await productApi.post<MaybeWrapped<boolean>>(`/api/favorites/${productId}`);
    const val = unwrap<boolean | undefined>(data);
    return val === undefined ? true : !!val;
}

/** 取消收藏 */
export async function removeFavorite(productId: string) {
    const { data } = await productApi.delete<MaybeWrapped<boolean>>(`/api/favorites/${productId}`);
    const val = unwrap<boolean | undefined>(data);
    return val === undefined ? true : !!val;
}

/** 按卖家列出在售（真实接口） */
export async function listSellerActive(
    sellerId: string,
    { page = 0, size = 12, sort = "createdAt,desc" }: { page?: number; size?: number; sort?: string } = {}
): Promise<Page<ProductRes>> {
    const { data } = await productApi.get<ApiResponse<Page<ProductRes>>>(`/api/products`, {
        params: { sellerId, status: "ACTIVE", page, size, sort },
    });
    if (!data.ok || !data.data) throw new Error(data.message || "List products failed");
    return data.data;
}
