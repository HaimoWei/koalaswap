import { orderApi } from "./http";
import type { ApiResponse, Page } from "./types";

export type OrderRes = {
    id: string;
    productId: string;
    buyerId: string;
    sellerId: string;
    priceSnapshot: number;
    status: string;           // PENDING | PAID | SHIPPED | COMPLETED | CANCELLED
    shippingAddressId?: string | null;
    shippingAddressSnapshot?: string | null;
    createdAt: string;
    closedAt?: string | null;
};

export async function createOrder(productId: string, shippingAddressId?: string) {
    const { data } = await orderApi.post<ApiResponse<OrderRes>>("/api/orders", {
        productId,
        shippingAddressId
    });
    if (!data.ok || !data.data) throw new Error(data.message || "Create order failed");
    return data.data;
}

export async function getOrder(id: string) {
    const { data } = await orderApi.get<ApiResponse<OrderRes>>(`/api/orders/${id}`);
    if (!data.ok || !data.data) throw new Error(data.message || "Order not found");
    return data.data;
}

export async function listOrders(params: {
    role: "buyer" | "seller";
    status?: string;                 // PENDING/PAID/SHIPPED/COMPLETED/CANCELLED
    page?: number; size?: number; sort?: string;
}) {
    const { role, status, page = 0, size = 10, sort = "createdAt,desc" } = params;
    const { data } = await orderApi.get<ApiResponse<Page<OrderRes>>>(`/api/orders`, {
        params: { role, status, page, size, sort },
    });
    if (!data.ok || !data.data) throw new Error(data.message || "List orders failed");
    return data.data;
}

/** 动作：支付/发货/确认/取消 —— 与后端保持一致（请求体可选） */
export async function payOrder(id: string, body?: { method?: string }) {
    const { data } = await orderApi.post<ApiResponse<OrderRes>>(`/api/orders/${id}/pay`, body || {});
    if (!data.ok || !data.data) throw new Error(data.message || "Pay failed");
    return data.data;
}
export async function shipOrder(id: string, body?: { trackingNo?: string; carrier?: string }) {
    const { data } = await orderApi.post<ApiResponse<OrderRes>>(`/api/orders/${id}/ship`, body || {});
    if (!data.ok || !data.data) throw new Error(data.message || "Ship failed");
    return data.data;
}
export async function confirmOrder(id: string) {
    const { data } = await orderApi.post<ApiResponse<OrderRes>>(`/api/orders/${id}/confirm`);
    if (!data.ok || !data.data) throw new Error(data.message || "Confirm failed");
    return data.data;
}
export async function cancelOrder(id: string, body?: { reason?: string }) {
    const { data } = await orderApi.post<ApiResponse<OrderRes>>(`/api/orders/${id}/cancel`, body || {});
    if (!data.ok || !data.data) throw new Error(data.message || "Cancel failed");
    return data.data;
}
