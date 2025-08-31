import { chatApi } from "./http";
import type { ApiResponse, Page } from "./types";

// 仅列出会用到的字段，后续阶段 5 再细化
export type ConversationResponse = {
    id: string;
    productId?: string | null;
    // ... 其它字段等你后续聊天页需要时再完善
};


// ====== 类型（按你的描述建模，字段尽量宽松以兼容后端） ======
export type MessageResponse = {
    id: string;
    type: "TEXT" | "IMAGE" | "SYSTEM";
    senderId: string;
    body?: string | null;
    imageUrl?: string | null;
    createdAt: string;
    // 可扩展：systemEvent/meta...
};

export type ConversationParticipant = {
    userId: string;
    // 服务端用于“已读指针”的字段名称可能不同：readTo / lastReadId ...
    readTo?: string | null;  // 最后已读消息ID
};

export type ConversationListItem = {
    id: string;
    productId?: string | null;
    orderId?: string | null;
    lastMessage?: MessageResponse | null;
    unreadCount?: number;
    pinned?: boolean;
    archived?: boolean;
    updatedAt?: string;
    participants?: ConversationParticipant[];
};

export type ConversationDetailResponse = {
    id: string;
    productId?: string | null;
    orderId?: string | null;
    participants: ConversationParticipant[]; // 双方
    // 可扩展：conversation title、对端用户简要、商品摘要等
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
