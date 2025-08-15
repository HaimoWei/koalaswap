import { delay, mem, nowISO } from "./db";
import { parseMockToken } from "./auth";

export async function mockToggleFavorite(token: string, productId: string) {
    await delay();
    const parsed = parseMockToken(token);
    if (!parsed) throw { message: "未登录" };
    const idx = mem.favourites.findIndex((f) => f.userId === parsed.uid && f.productId === productId);
    if (idx >= 0) {
        mem.favourites.splice(idx, 1);
        return { fav: false };
    }
    mem.favourites.push({ userId: parsed.uid, productId, createdAt: nowISO() });
    return { fav: true };
}

export async function mockIsFavorite(token: string, productId: string) {
    await delay();
    const parsed = parseMockToken(token);
    if (!parsed) return { fav: false };
    return { fav: !!mem.favourites.find((f) => f.userId === parsed.uid && f.productId === productId) };
}

export async function mockListFavorites(token: string) {
    await delay();
    const parsed = parseMockToken(token);
    if (!parsed) throw { message: "未登录" };
    const ids = mem.favourites.filter((f) => f.userId === parsed.uid).map((f) => f.productId);
    return mem.products
        .filter((p) => ids.includes(p.id))
        .map((p) => {
            const s = mem.users.find((u) => u.id === p.sellerId);
            return { ...p, seller: s ? { id: s.id, displayName: s.displayName, avatarUrl: s.avatarUrl } : null };
        });
}
