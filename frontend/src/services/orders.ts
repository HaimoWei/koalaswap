import { ENV } from "../lib/env";
import { orderApi } from "../lib/api";
import { unwrap } from "../lib/unwrap";

export type Order = {
    id: string;
    productId: string;
    buyerId: string;
    sellerId: string;
    priceSnapshot: number;
    status: "PENDING" | "PAID" | "SHIPPED" | "COMPLETED" | "CANCELLED";
    createdAt: string;
    closedAt?: string | null;
};

type Page<T> = { content: T[]; totalElements: number; totalPages: number; number: number; size: number };

export const OrderService = {
    /** 立即下单：POST /api/orders  */
    async buyNow(_token: string, productId: string, priceExpected?: number, note?: string): Promise<Order> {
        if (ENV.USE_MOCKS) {
            const { mockBuyNow } = await import("../mocks/orders");
            return mockBuyNow(_token, productId) as any;
        }
        const res = await orderApi.post("/api/orders", { productId, priceExpected, note });
        return unwrap(res.data) as Order;
    },

    /** 我买到的：GET /api/orders?role=buyer */
    async myOrders(_token: string, params: { status?: string; page?: number; size?: number; sort?: string } = {}): Promise<Order[]> {
        if (ENV.USE_MOCKS) {
            const { mockListMyOrders } = await import("../mocks/orders");
            return mockListMyOrders(_token) as any;
        }
        const res = await orderApi.get("/api/orders", { params: { role: "buyer", ...params } });
        const page = unwrap(res.data) as Page<Order> | Order[];
        return Array.isArray((page as any).content) ? (page as Page<Order>).content : (page as Order[]);
    },

    /** 我卖出的：GET /api/orders?role=seller */
    async sold(_token: string, params: { status?: string; page?: number; size?: number; sort?: string } = {}): Promise<Order[]> {
        if (ENV.USE_MOCKS) {
            const { mockListSold } = await import("../mocks/orders");
            return mockListSold(_token) as any;
        }
        const res = await orderApi.get("/api/orders", { params: { role: "seller", ...params } });
        const page = unwrap(res.data) as Page<Order> | Order[];
        return Array.isArray((page as any).content) ? (page as Page<Order>).content : (page as Order[]);
    },

    /** 操作：支付 */
    async pay(id: string, method: string = "mock") {
        const res = await orderApi.post(`/api/orders/${id}/pay`, { method });
        return unwrap(res.data) as Order;
    },

    /** 操作：发货（卖家） */
    async ship(id: string, trackingNo?: string, carrier?: string) {
        const res = await orderApi.post(`/api/orders/${id}/ship`, { trackingNo, carrier });
        return unwrap(res.data) as Order;
    },

    /** 操作：确认收货（买家） */
    async confirm(id: string) {
        const res = await orderApi.post(`/api/orders/${id}/confirm`, {});
        return unwrap(res.data) as Order;
    },

    /** 操作：取消（买家/卖家） */
    async cancel(id: string, reason?: string) {
        const res = await orderApi.post(`/api/orders/${id}/cancel`, reason ? { reason } : {});
        return unwrap(res.data) as Order;
    },
};

export default OrderService;
