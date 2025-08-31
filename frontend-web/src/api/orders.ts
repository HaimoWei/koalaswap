import { orderApi } from "./http";
import type { ApiResponse, Page } from "./types";

export type OrderRes = {
    id: string;
    productId: string;
    buyerId: string;
    sellerId: string;
    priceSnapshot: number;
    status: string;
    createdAt: string;
    closedAt?: string | null;
};

export async function createOrder(productId: string) {
    const { data } = await orderApi.post<ApiResponse<OrderRes>>("/api/orders", { productId });
    if (!data.ok || !data.data) throw new Error(data.message || "Create order failed");
    return data.data;
}

// 订单详情
export async function getOrder(id: string) {
    const { data } = await orderApi.get<ApiResponse<OrderRes>>(`/api/orders/${id}`);
    if (!data.ok || !data.data) throw new Error(data.message || "Order not found");
    return data.data;
}

// 订单列表（买家/卖家）
export async function listOrders(params: {
    role: "buyer" | "seller";
    status?: string;                 // 可选：CREATED/PAID/SHIPPED/CONFIRMED/CANCELLED
    page?: number; size?: number; sort?: string;
}) {
    const { role, status, page = 0, size = 10, sort = "createdAt,desc" } = params;
    const { data } = await orderApi.get<ApiResponse<Page<OrderRes>>>(`/api/orders`, {
        params: { role, status, page, size, sort },
    });
    if (!data.ok || !data.data) throw new Error(data.message || "List orders failed");
    return data.data;
}

// 动作：支付/发货/确认/取消
export async function payOrder(id: string) {
    const { data } = await orderApi.post<ApiResponse<OrderRes>>(`/api/orders/${id}/pay`);
    if (!data.ok || !data.data) throw new Error(data.message || "Pay failed");
    return data.data;
}
export async function shipOrder(id: string) {
    const { data } = await orderApi.post<ApiResponse<OrderRes>>(`/api/orders/${id}/ship`);
    if (!data.ok || !data.data) throw new Error(data.message || "Ship failed");
    return data.data;
}
export async function confirmOrder(id: string) {
    const { data } = await orderApi.post<ApiResponse<OrderRes>>(`/api/orders/${id}/confirm`);
    if (!data.ok || !data.data) throw new Error(data.message || "Confirm failed");
    return data.data;
}
export async function cancelOrder(id: string) {
    const { data } = await orderApi.post<ApiResponse<OrderRes>>(`/api/orders/${id}/cancel`);
    if (!data.ok || !data.data) throw new Error(data.message || "Cancel failed");
    return data.data;
}
