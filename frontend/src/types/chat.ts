// src/types/chat.ts
// 与 chat-service 的 DTO / 枚举完全对齐（record 字段同名）

export type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "COMPLETED" | "CANCELLED";
export type MessageType = "TEXT" | "IMAGE" | "SYSTEM";
// 系统事件当前即订单状态枚举
export type SystemEvent = OrderStatus;

// === DTO ===

export type ConversationListItem = {
    id: string;
    productId: string;
    orderId?: string | null;
    buyerId: string;
    sellerId: string;
    peerUserId: string;
    unread: number;
    archived: boolean;
    pinnedAt?: string | null;
    orderStatus?: OrderStatus | null;
    productFirstImage?: string | null;
    lastMessageAt?: string | null;
    lastMessagePreview?: string | null;
    // 聚合补充字段（可能为 null）
    peerNickname?: string | null;
    peerAvatar?: string | null;
};

export type ConversationResponse = {
    id: string;
    productId: string;
    orderId?: string | null;
    buyerId: string;
    sellerId: string;
    orderStatus?: OrderStatus | null;
    productFirstImage?: string | null;
    lastMessageAt?: string | null;
    lastMessagePreview?: string | null;
};

export type MessageResponse = {
    id: string;
    type: MessageType;
    senderId?: string | null; // SYSTEM 消息为 null
    body?: string | null;
    imageUrl?: string | null;
    systemEvent?: SystemEvent | null;
    meta?: string | null;     // JSON 字符串
    createdAt: string;
};

// === Request ===
export type CreateConversationRequest = {
    productId: string;
    orderId?: string | null;
    sellerId?: string | null;
};

export type SendMessageRequest = {
    type: MessageType;
    body?: string | null;
    imageUrl?: string | null;
};


export type ConversationDetailResponse = {
    id: string;
    productId: string;
    buyerId: string;
    sellerId: string;
    orderStatus?: OrderStatus | null;
    productFirstImage?: string | null;
    myReadToMessageId?: string | null;
    peerReadToMessageId?: string | null;
};

export type ReadReceiptEvent = {
    readerId: string;
    readTo: string | null;
};