import { productApi } from "./http";
import type { ApiResponse, Page } from "./types";
import type { ProductRes } from "./types";

// 收藏卡片：兼容两种形态（有的直接是 ProductRes，有的是 { product: ProductRes, favoritedAt: ... }）
export type FavoriteProductCard =
    | ProductRes
    | { product: ProductRes; favoritedAt?: string };

// 列表
export async function getFavorites(params: { page?: number; size?: number; sort?: string } = {}) {
    const { page = 0, size = 20, sort = "createdAt,desc" } = params;
    const { data } = await productApi.get<ApiResponse<Page<FavoriteProductCard>>>("/api/favorites", {
        params: { page, size, sort },
    });
    if (!data.ok || !data.data) throw new Error(data.message || "Fetch favorites failed");
    return data.data;
}

// 总数
export async function getFavoritesCount() {
    const { data } = await productApi.get<ApiResponse<number>>("/api/favorites/count");
    if (!data.ok || data.data == null) throw new Error(data.message || "Fetch fav count failed");
    return data.data;
}

// 取消收藏：已在第三阶段的 products.ts 里实现 removeFavorite(productId)
