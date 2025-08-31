// src/ws/stomp.ts
import { Client } from "@stomp/stompjs";
import type { IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client/dist/sockjs.js";
import { useAuthStore } from "../store/auth";

const wsBase = import.meta.env.VITE_CHAT_WS_BASE_URL; // 例如 http://localhost:12652
const WS_PATH = "/ws/chat"; // 后端 STOMP 端点

let client: Client | null = null;

export function getStomp(): Client {
    if (client) return client;

    client = new Client({
        webSocketFactory: () => new SockJS(`${wsBase}${WS_PATH}`),

        // 自动重连
        reconnectDelay: 2000,

        // 心跳（后端若开启）
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,

        // 关键：在连接前，把最新 token 写入 connectHeaders（而不是把 connectHeaders 写成函数）
        beforeConnect: () => {
            const token = useAuthStore.getState().token;
            client!.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
        },

        // 可选调试
        // debug: (str) => console.log("[STOMP]", str),
    });

    client.activate();
    return client;
}

/**
 * 内部工具：保证订阅一定发生
 * - 已连接：直接订阅
 * - 未连接：挂到 onConnect 里，连上后订阅
 */
function ensureSubscription(
    topic: string,
    onMessage: (msg: IMessage) => void
): StompSubscription | null {
    const c = getStomp();
    if (c.connected) {
        return c.subscribe(topic, onMessage);
    }
    // 等连接完再订阅
    const handler = () => {
        c.subscribe(topic, onMessage);
    };
    // 只监听一次
    const prevOnConnect = c.onConnect;
    c.onConnect = (frame) => {
        prevOnConnect?.(frame);
        handler();
        // 订阅完即可恢复原来的 onConnect，避免重复订阅
        c.onConnect = prevOnConnect || undefined;
    };
    return null;
}

// 订阅某会话的新消息
export function subscribeConversationMessages(
    conversationId: string,
    onMessage: (msg: IMessage) => void
): StompSubscription | null {
    return ensureSubscription(`/topic/chat/conversations/${conversationId}`, onMessage);
}

// 订阅某会话的读回执
export function subscribeConversationRead(
    conversationId: string,
    onMessage: (msg: IMessage) => void
): StompSubscription | null {
    return ensureSubscription(`/topic/chat/conversations/${conversationId}/read`, onMessage);
}
