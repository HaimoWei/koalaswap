// src/services/chat.ts
// Chat REST 封装（Part A）：契约与 chat-service 完全一致

import { chatApi } from "../lib/api";
import { unwrap } from "../lib/unwrap";
import type { Page } from "../lib/types";
import type {
    ConversationListItem,
    ConversationResponse,
    CreateConversationRequest,
    MessageResponse,
    SendMessageRequest,
} from "../types/chat";

import type { ConversationDetailResponse } from "../types/chat";

export const ChatService = {
    /** 创建或获取会话：POST /api/chat/conversations */
    async createOrGetConversation(req: CreateConversationRequest): Promise<ConversationResponse> {
        const res = await chatApi.post("/api/chat/conversations", req);
        return unwrap<ConversationResponse>(res.data);
    },

    /** 会话列表：GET /api/chat/conversations?page&size&onlyArchived&onlyPinned&aggregate */
    async listConversations(params: {
        page?: number;
        size?: number;
        onlyArchived?: boolean;
        onlyPinned?: boolean;
        /** 是否做昵称/头像/订单状态聚合（后端默认 true） */
        aggregate?: boolean;
    } = {}): Promise<Page<ConversationListItem>> {
        const res = await chatApi.get("/api/chat/conversations", {
            params: {
                page: params.page ?? 0,
                size: params.size ?? 20,
                onlyArchived: !!params.onlyArchived,
                onlyPinned: !!params.onlyPinned,
                aggregate: params.aggregate ?? true,
            },
        });
        return unwrap<Page<ConversationListItem>>(res.data);
    },

    /** 消息分页：GET /api/chat/conversations/{id}/messages?page&size */
    async getMessages(conversationId: string, params: { page?: number; size?: number } = {}): Promise<Page<MessageResponse>> {
        const res = await chatApi.get(`/api/chat/conversations/${conversationId}/messages`, {
            params: { page: params.page ?? 0, size: params.size ?? 20 },
        });
        return unwrap<Page<MessageResponse>>(res.data);
    },

    /** 发送消息：POST /api/chat/conversations/{id}/messages */
    async sendMessage(conversationId: string, payload: SendMessageRequest): Promise<MessageResponse> {
        const res = await chatApi.post(`/api/chat/conversations/${conversationId}/messages`, payload);
        return unwrap<MessageResponse>(res.data);
    },

    /** 标记已读：POST /api/chat/conversations/{id}/read?lastMessageId */
    async markRead(conversationId: string, lastMessageId?: string | null): Promise<boolean> {
        const res = await chatApi.post(`/api/chat/conversations/${conversationId}/read`, null, {
            params: lastMessageId ? { lastMessageId } : undefined,
        });
        return unwrap<boolean>(res.data);
    },

    /** 归档/取消归档：POST /api/chat/conversations/{id}/archive?archive=bool */
    async archive(conversationId: string, archive: boolean): Promise<boolean> {
        const res = await chatApi.post(`/api/chat/conversations/${conversationId}/archive`, null, {
            params: { archive },
        });
        return unwrap<boolean>(res.data);
    },

    /** 置顶/取消置顶：POST /api/chat/conversations/{id}/pin?pin=bool */
    async pin(conversationId: string, pin: boolean): Promise<boolean> {
        const res = await chatApi.post(`/api/chat/conversations/${conversationId}/pin`, null, {
            params: { pin },
        });
        return unwrap<boolean>(res.data);
    },

    /** 静音：POST /api/chat/conversations/{id}/mute?minutes=30（传空则取消静音） */
    async mute(conversationId: string, minutes?: number | null): Promise<boolean> {
        const res = await chatApi.post(`/api/chat/conversations/${conversationId}/mute`, null, {
            params: minutes ? { minutes } : undefined,
        });
        return unwrap<boolean>(res.data);
    },

    /** 软删除会话：DELETE /api/chat/conversations/{id} */
    async delete(conversationId: string): Promise<boolean> {
        const res = await chatApi.delete(`/api/chat/conversations/${conversationId}`);
        return unwrap<boolean>(res.data);
    },

    async getConversation(conversationId: string): Promise<ConversationDetailResponse> {
        const res = await chatApi.get(`/api/chat/conversations/${conversationId}`);
        return unwrap<ConversationDetailResponse>(res.data);
    },
};
