// 一个“内存数据库”：只在 App 运行期有效，重启就清空。
// 目的：前端独立开发。将来联调替换为真实 HTTP 即可。
// 这是一个最小可用的 mocks/db.ts；如果你原来更完整，也可以只把 seed() 替换成这里的版本。
// src/mocks/db.ts
// 轻量内存数据库（离线开发用）—— 同时导出 named 和 default
// 统一的“内存数据库” & 工具；支持 default 和 named 两种导出
// src/mocks/db.ts
// 统一的轻量“内存数据库”，所有 mocks/* 共用这一份。
// 令牌体系：auth.ts 生成 mock token（"mock.{uid}.{pv}"），其他模块用 parseMockToken 解析。

export type UserRecord = {
    id: string;
    email: string;
    password: string;
    displayName: string;
    avatarUrl: string | null;
    emailVerified: boolean;
    tokenVersion: number;
    createdAt: string;
};

export type ProductImage = { id: string; imageUrl: string; sortOrder: number };

export type ProductRecord = {
    id: string;
    sellerId: string;
    title: string;
    description: string;
    price: number;
    currency: "AUD";
    condition: "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "POOR";
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    images: ProductImage[];
    categoryId: number | null;
    freeShipping: boolean;
};

export type OrderRecord = {
    id: string;
    productId: string;
    buyerId: string;
    sellerId: string;
    priceSnapshot: number;
    status: "PENDING" | "PAID" | "CLOSED";
    createdAt: string;
};

export const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));
export const nowISO = () => new Date().toISOString();
const rand = (len = 10) => Math.random().toString(36).slice(2, 2 + len);
export const genId = (p: string) => `${p}${rand(10)}`;

// 所有模块共享的内存区
export const mem = {
    users: [] as UserRecord[],
    products: [] as ProductRecord[],
    orders: [] as OrderRecord[],
    favourites: [] as { userId: string; productId: string; createdAt: string }[],
    verifyTokens: [] as { token: string; userId: string; expiresAt: number; used: boolean }[],
    resetTokens: [] as { token: string; userId: string; expiresAt: number; used: boolean }[],
};

// ---------- 种子数据 ----------
(function seed() {
    if (mem.users.length) return;

    const u1: UserRecord = {
        id: genId("u_"),
        email: "demo@koala.au",
        password: "123456",
        displayName: "Demo Koala",
        avatarUrl: null,
        emailVerified: true,
        tokenVersion: 1,
        createdAt: nowISO(),
    };
    const u2: UserRecord = {
        id: genId("u_"),
        email: "seller@koala.au",
        password: "123456",
        displayName: "Koala Seller",
        avatarUrl: null,
        emailVerified: true,
        tokenVersion: 1,
        createdAt: nowISO(),
    };
    mem.users.push(u1, u2);

    const pickSeller = (i: number) => (i % 2 === 0 ? u1.id : u2.id);

    for (let i = 1; i <= 36; i++) {
        mem.products.push({
            id: genId("p_"),
            sellerId: pickSeller(i),
            title: `种子商品 #${i}`,
            description: `这是第 ${i} 个种子商品的描述（离线数据）`,
            price: 9 + i,
            currency: "AUD",
            condition: (["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"] as const)[i % 5],
            isActive: true,
            createdAt: nowISO(),
            updatedAt: nowISO(),
            images: [{ id: genId("img_"), imageUrl: `https://picsum.photos/seed/${i}/700/460`, sortOrder: 0 }],
            categoryId: null,
            freeShipping: i % 3 === 0,
        });
    }
})();
