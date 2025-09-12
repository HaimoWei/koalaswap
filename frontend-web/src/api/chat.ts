import { chatApi } from "./http";
import type { ApiResponse, Page } from "./types";

// 按后端 chat-service 对齐的最小字段集合
export type ConversationResponse = {
    id: string;
    productId?: string | null;
    orderId?: string | null;
    buyerId?: string;
    sellerId?: string;
    orderStatus?: string | null;
    productFirstImage?: string | null;
    lastMessageAt?: string | null;
    lastMessagePreview?: string | null;
};

// ====== DTO（与后端枚举/字段对齐，必要字段最小化） ======
export type MessageResponse = {
    id: string;
    type: "TEXT" | "IMAGE" | "SYSTEM";
    senderId: string | null; // SYSTEM 为 null
    body?: string | null;
    imageUrl?: string | null;
    systemEvent?: "ORDER_PLACED" | "PAID" | "SHIPPED" | "COMPLETED" | "CANCELLED" | null;
    meta?: string | null;
    createdAt: string;
};

export type ConversationListItem = {
    id: string;
    productId?: string | null;
    orderId?: string | null;
    buyerId?: string;
    sellerId?: string;
    peerUserId?: string;
    unread: number;
    archived: boolean;
    pinnedAt?: string | null;
    orderStatus?: string | null;
    productFirstImage?: string | null;
    lastMessageAt?: string | null;
    lastMessagePreview?: string | null;
    peerNickname?: string | null;
    peerAvatar?: string | null;
    // 新增商品信息字段
    productTitle?: string | null;
    productPrice?: number | null;
    // 新增订单价格快照
    orderPriceSnapshot?: number | null;
};

export type OrderDetail = {
    orderId: string;
    priceSnapshot?: number | null;
    status?: string | null;
    createdAt?: string | null;
    trackingNo?: string | null;
    carrier?: string | null;
};

export type ConversationDetailResponse = {
    id: string;
    productId: string;
    buyerId: string;
    sellerId: string;
    orderStatus?: string | null;
    productFirstImage?: string | null;
    myReadToMessageId?: string | null;
    peerReadToMessageId?: string | null;
    // 新增商品信息
    productTitle?: string | null;
    productPrice?: number | null;
    // 新增对方用户信息
    peerNickname?: string | null;
    peerAvatar?: string | null;
    // 新增完整订单信息
    orderDetail?: OrderDetail | null;
};


export async function createConversation(payload: { productId: string; sellerId?: string }) {
    const { data } = await chatApi.post<ApiResponse<ConversationResponse>>("/api/chat/conversations", payload);
    if (!data.ok || !data.data) throw new Error(data.message || "Create conversation failed");
    return data.data;
}

// ====== REST APIs ======
export async function listConversations(params: {
    page?: number; size?: number;
    onlyArchived?: boolean; onlyPinned?: boolean;
    aggregate?: boolean; // 后端若支持，返回 lastMessage/unread
}) {
    const { page = 0, size = 20, onlyArchived, onlyPinned, aggregate = true } = params || {};
    const { data } = await chatApi.get<ApiResponse<Page<ConversationListItem>>>("/api/chat/conversations", {
        params: { page, size, onlyArchived, onlyPinned, aggregate },
    });
    if (!data.ok || !data.data) throw new Error(data.message || "List conversations failed");
    return data.data;
}

export async function getConversation(id: string) {
    const { data } = await chatApi.get<ApiResponse<ConversationDetailResponse>>(`/api/chat/conversations/${id}`);
    if (!data.ok || !data.data) throw new Error(data.message || "Conversation not found");
    return data.data;
}

export async function listMessages(params: { id: string; page?: number; size?: number }) {
    const { id, page = 0, size = 20 } = params;
    const { data } = await chatApi.get<ApiResponse<Page<MessageResponse>>>(`/api/chat/conversations/${id}/messages`, {
        params: { page, size },
    });
    if (!data.ok || !data.data) throw new Error(data.message || "List messages failed");
    return data.data;
}

export async function sendTextMessage(id: string, body: string) {
    const { data } = await chatApi.post<ApiResponse<MessageResponse>>(`/api/chat/conversations/${id}/messages`, {
        type: "TEXT",
        body,
    });
    if (!data.ok || !data.data) throw new Error(data.message || "Send message failed");
    return data.data;
}

export async function sendImageMessage(id: string, imageUrl: string) {
    const { data } = await chatApi.post<ApiResponse<MessageResponse>>(`/api/chat/conversations/${id}/messages`, {
        type: "IMAGE",
        imageUrl,
    });
    if (!data.ok || !data.data) throw new Error(data.message || "Send image failed");
    return data.data;
}

export async function markRead(id: string, lastMessageId: string) {
    const { data } = await chatApi.post<ApiResponse<boolean>>(`/api/chat/conversations/${id}/read`, null, {
        params: { lastMessageId },
    });
    if (!data.ok) throw new Error(data.message || "Mark read failed");
    return true;
}
