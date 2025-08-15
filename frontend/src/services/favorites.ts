import { ENV } from "../lib/env";
import { mockIsFavorite, mockListFavorites, mockToggleFavorite } from "../mocks/favorites";

export const FavoriteService = {
    toggle(token: string, productId: string) {
        if (ENV.USE_MOCKS) return mockToggleFavorite(token, productId);
        throw new Error("TODO");
    },
    isFav(token: string, productId: string) {
        if (ENV.USE_MOCKS) return mockIsFavorite(token, productId);
        throw new Error("TODO");
    },
    listMine(token: string) {
        if (ENV.USE_MOCKS) return mockListFavorites(token);
        throw new Error("TODO");
    },
};

export default FavoriteService;
