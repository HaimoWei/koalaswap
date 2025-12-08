import { delay, genId, mem, nowISO } from "./db";
import { parseMockToken } from "./auth";

export type ListParams = { page?: number; size?: number; keyword?: string; excludeSellerId?: string };
export type Page<T> = { content: T[]; page: number; size: number; totalElements: number; totalPages: number };

function joinSeller(p: any) {
    const s = mem.users.find(u => u.id === p.sellerId);
    return { ...p, seller: s ? { id: s.id, displayName: s.displayName, avatarUrl: s.avatarUrl } : null };
}

export async function mockListProducts(params: ListParams = {}): Promise<Page<any>> {
    await delay();
    const page = Math.max(0, params.page ?? 0);
    const size = Math.max(1, params.size ?? 10);
    let arr = mem.products.filter(p => p.isActive);
    if (params.excludeSellerId) arr = arr.filter(p => p.sellerId !== params.excludeSellerId);
    if (params.keyword) {
        const kw = params.keyword.toLowerCase();
        arr = arr.filter(p => (p.title + " " + (p.description || "")).toLowerCase().includes(kw));
    }
    const total = arr.length;
    const start = page * size;
    const end = start + size;
    const content = arr.slice(start, end).map(joinSeller);
    return { content, page, size, totalElements: total, totalPages: Math.ceil(total / size) };
}

export async function mockGetProduct(id: string) {
    await delay();
    const p = mem.products.find(x => x.id === id);
    if (!p) throw { message: "商品不存在" };
    return joinSeller(p);
}

export async function mockCreateProduct(token: string, payload: Partial<any>) {
    await delay();
    const parsed = parseMockToken(token); if (!parsed) throw { message: "未登录", code: "UNAUTH" };
    const p = {
        id: genId("p_"),
        sellerId: parsed.uid,
        title: payload.title || "未命名商品",
        description: payload.description || "",
        price: Number(payload.price || 0),
        currency: "AUD" as const,
        condition: (payload.condition || "GOOD") as any,
        freeShipping: !!payload.freeShipping,
        isActive: true,
        createdAt: nowISO(), updatedAt: nowISO(),
        images: (payload.images as any) || [{ id: genId("img_"), imageUrl: "https://picsum.photos/seed/new/600/400", sortOrder: 0 }],
        categoryId: payload.categoryId ?? null,
    };
    mem.products.unshift(p);
    return joinSeller(p);
}

export async function mockUpdateProduct(token: string, id: string, patch: Partial<any>) {
    await delay();
    const parsed = parseMockToken(token); if (!parsed) throw { message: "未登录", code: "UNAUTH" };
    const idx = mem.products.findIndex(p => p.id === id);
    if (idx === -1) throw { message: "商品不存在" };
    const origin = mem.products[idx];
    if (origin.sellerId !== parsed.uid) throw { message: "只能修改自己的商品", code: "FORBIDDEN" };
    const next = { ...origin, ...patch, updatedAt: nowISO() };
    mem.products[idx] = next;
    return joinSeller(next);
}

export async function mockDeleteProduct(token: string, id: string) {
    await delay();
    const parsed = parseMockToken(token); if (!parsed) throw { message: "未登录", code: "UNAUTH" };
    const idx = mem.products.findIndex(p => p.id === id);
    if (idx === -1) return { ok: true };
    if (mem.products[idx].sellerId !== parsed.uid) throw { message: "只能删除自己的商品", code: "FORBIDDEN" };
    mem.products.splice(idx, 1);
    return { ok: true };
}

export async function mockListMyProducts(token: string) {
    await delay();
    const parsed = parseMockToken(token); if (!parsed) throw { message: "未登录" };
    return mem.products.filter(p => p.sellerId === parsed.uid).map(joinSeller);
}

export async function mockDiscount(token: string, id: string, delta: number) {
    await delay();
    const p = await mockGetProduct(id);
    return mockUpdateProduct(token, id, { price: Math.max(0, p.price + delta) });
}
