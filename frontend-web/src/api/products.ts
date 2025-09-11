// src/api/products.ts
import { productApi } from "./http";
import type { Page, ProductRes, ApiResponse } from "./types";
import { DEBUG, dlog } from "../debug";

/** ========== 新增：发布所需类型（与后端枚举保持一致） ========== */
export type Condition = "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "POOR";

export interface ProductCreateReq {
    title: string;
    description?: string;
    price: number;            // BigDecimal -> number
    currency: string;         // 例：AUD/CNY/USD
    categoryId?: number | null;
    condition: Condition;
    images?: string[];        // 先用URL，后续可接直传
}
/** ======================================================== */

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
    keyword?: string;   // 前端用 keyword
    catId?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
};

export async function searchProducts(params: SearchParams) {
    const {
        page = 0, size = 20, keyword, catId, minPrice, maxPrice, sort = "createdAt,desc",
    } = params;

    // 兼容：后端参数名是 kw，这里做一次映射
    const { data } = await productApi.get<MaybeWrapped<Page<ProductRes>>>(
        "/api/products",
        { params: { page, size, kw: keyword, catId, minPrice, maxPrice, sort } }
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
        // 如果后端不支持 sellerId，这里可以考虑改为 /api/products/mine 或服务端加筛选
        params: { sellerId, status: "ACTIVE", page, size, sort },
    });
    if (!data.ok || !data.data) throw new Error(data.message || "List products failed");
    return data.data;
}

/* ========= 发 布 ========= */
export async function createProduct(payload: ProductCreateReq): Promise<ProductRes> {
    // 保持与文件中其它函数一致的风格（productApi + ApiResponse 校验）
    const { data } = await productApi.post<ApiResponse<ProductRes>>("/api/products", payload);
    if (!data.ok || !data.data) throw new Error(data.message || "Create product failed");
    return data.data;
}

/* ========= 卖家操作（与您示例一致） ========= */
export async function hideProduct(id: string): Promise<void> {
    const { data } = await productApi.post<ApiResponse<void>>(`/api/products/${id}/hide`);
    if (data && data.ok === false) throw new Error(data.message || "Hide failed");
}

export async function relistProduct(id: string): Promise<void> {
    const { data } = await productApi.post<ApiResponse<void>>(`/api/products/${id}/relist`);
    if (data && data.ok === false) throw new Error(data.message || "Relist failed");
}

export async function deleteProduct(id: string, hard = false): Promise<void> {
    const { data } = await productApi.delete<ApiResponse<void>>(`/api/products/${id}`, {
        params: { hard },
    });
    if (data && data.ok === false) throw new Error(data.message || "Delete failed");
}