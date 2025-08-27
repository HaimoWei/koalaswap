import { ENV } from "../lib/env";
import { productApi } from "../lib/api";
import { unwrap } from "../lib/unwrap";
import type { ApiResponse, Page } from "../lib/types";

type FavoriteCheckRes = { productId: string; favorited: boolean };
type FavoriteProductCard = { product: any; favoritedAt?: string };

export const FavoriteService = {
    /** Toggle：若已收藏则取消，否则添加 */
    async toggle(token: string, productId: string) {
        if (ENV.USE_MOCKS) {
            const { mockToggleFavorite } = await import("../mocks/favorites");
            return mockToggleFavorite(token, productId);
        }
        const fav = await this.isFav(token, productId);
        if (fav) {
            await productApi.delete<ApiResponse<boolean>>(`/api/favorites/${productId}`);
            return { fav: false };
        } else {
            await productApi.post<ApiResponse<boolean>>(`/api/favorites/${productId}`);
            return { fav: true };
        }
    },

    /** 显示用：是否收藏 */
    async isFav(token: string, productId: string) {
        if (ENV.USE_MOCKS) {
            const { mockIsFavorite } = await import("../mocks/favorites");
            return mockIsFavorite(token, productId);
        }
        const res = await productApi.get<ApiResponse<FavoriteCheckRes>>(`/api/favorites/check`, {
            params: { productId },
        });
        const obj = unwrap(res.data);
        return !!obj?.favorited;
    },

    /** 删除收藏（显式删除；与 toggle 配合） */
    async remove(token: string, productId: string) {
        if (ENV.USE_MOCKS) {
            const { mockToggleFavorite } = await import("../mocks/favorites");
            await mockToggleFavorite(token, productId);
            return { ok: true };
        }
        await productApi.delete<ApiResponse<boolean>>(`/api/favorites/${productId}`);
        return { ok: true };
    },

    /** 我的收藏列表（扁平化为 product[]，便于复用 ProductCard） */
    async listMine(token: string, page = 0, size = 50) {
        if (ENV.USE_MOCKS) {
            const { mockListFavorites } = await import("../mocks/favorites");
            return mockListFavorites(token);
        }
        const res = await productApi.get<ApiResponse<Page<FavoriteProductCard>>>(`/api/favorites`, {
            params: { page, size, sort: "createdAt,DESC" },
        });
        const pg = unwrap(res.data);
        const arr = Array.isArray(pg?.content) ? pg.content : [];
        return arr.map((card: any) => {
            const p = card?.product ?? card;
            return { ...p, favoritedAt: card?.favoritedAt ?? null };
        });
    },

    /** 我的收藏总数（用于 Me 页统计） */
    async countMine(token: string) {
        if (ENV.USE_MOCKS) {
            const list = await this.listMine(token);
            return Array.isArray(list) ? list.length : 0;
        }
        const res = await productApi.get<ApiResponse<Page<any>>>(`/api/favorites`, {
            params: { page: 0, size: 1 , sort: "createdAt,DESC" },
        });
        const pg = unwrap(res.data);
        const total = typeof pg?.totalElements === "number" ? pg.totalElements : 0;
        return total;
    },
};

export default FavoriteService;
