// src/mocks/orders.ts
// src/mocks/order.ts
import { delay, genId, mem, nowISO } from "./db";
import { parseMockToken } from "./auth";
import { mockGetProduct } from "./products";

export async function mockBuyNow(token: string, productId: string) {
    await delay();
    const parsed = parseMockToken(token);
    if (!parsed) throw { message: "未登录" };

    const p = await mockGetProduct(productId); // 带 seller 信息
    const idx = mem.products.findIndex((x) => x.id === productId);
    if (idx < 0) throw { message: "商品不存在" };

    // 已下架/已售出防重购
    if (!mem.products[idx].isActive) {
        throw { message: "该商品已下架/已售出" };
    }
    // 不能买自己的
    if (p.sellerId === parsed.uid) {
        throw { message: "不能购买自己的商品" };
    }

    // 下单：创建订单并把商品标记为下架
    const order = {
        id: genId("o_"),
        productId: p.id,
        buyerId: parsed.uid,
        sellerId: p.sellerId,
        priceSnapshot: p.price,
        status: "PENDING" as const,
        createdAt: nowISO(),
    };
    mem.orders.unshift(order);

    // 关键：把商品设置为下架
    mem.products[idx].isActive = false;
    mem.products[idx].updatedAt = nowISO();

    return order;
}

export async function mockListMyOrders(token: string) {
    await delay();
    const parsed = parseMockToken(token);
    if (!parsed) throw { message: "未登录" };
    return mem.orders.filter((o) => o.buyerId === parsed.uid);
}

export async function mockListSold(token: string) {
    await delay();
    const parsed = parseMockToken(token);
    if (!parsed) throw { message: "未登录" };
    return mem.orders.filter((o) => o.sellerId === parsed.uid);
}
