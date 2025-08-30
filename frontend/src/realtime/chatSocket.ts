// STOMP + SockJS 单例封装：自动重连、连接就绪后再订阅
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { ENV } from "../lib/env";
import type { ReadReceiptEvent } from "../types/chat";

type MsgHandler = (body: string) => void;

class ChatSocket {
    private client: Client | null = null;
    private connected = false;
    private connecting = false;
    private uid: string | null = null;
    private baseUrl: string = ENV.CHAT_API_BASE_URL || "";
    private onConnectResolvers: Array<() => void> = [];

    connect(params: { uid: string }): void {
        const nextUid = params.uid || "";
        if (!this.baseUrl) {
            console.warn("[chatSocket] CHAT_API_BASE_URL 未配置");
            return;
        }
        if (this.client && this.connected && this.uid === nextUid) return;

        if (this.client) {
            try { this.client.deactivate(); } catch {}
            this.client = null;
            this.connected = false;
            this.connecting = false;
        }
        this.uid = nextUid;

        const client = new Client({
            webSocketFactory: () => new SockJS(`${this.baseUrl}/ws/chat`),
            connectHeaders: { uid: this.uid || "" },
            reconnectDelay: 3000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            debug: () => {},
            onConnect: () => {
                this.connected = true;
                this.connecting = false;
                this.onConnectResolvers.splice(0).forEach(fn => fn());
            },
            onStompError: (frame) => {
                console.warn("[chatSocket] stomp error", frame.headers["message"]);
            },
            onWebSocketClose: () => {
                this.connected = false;
                this.connecting = false;
            },
            onDisconnect: () => {
                this.connected = false;
                this.connecting = false;
            }
        });

        this.client = client;
        this.connecting = true;
        client.activate();
    }

    disconnect(): void {
        if (this.client) {
            try { this.client.deactivate(); } catch {}
            this.client = null;
        }
        this.connected = false;
        this.connecting = false;
    }

    private ensureConnected(): Promise<void> {
        if (this.connected && this.client) return Promise.resolve();
        return new Promise((resolve) => { this.onConnectResolvers.push(resolve); });
    }

    /** 订阅会话消息 */
    async subscribeConversation(conversationId: string, handler: MsgHandler): Promise<() => void> {
        if (!this.client) { console.warn("[chatSocket] 请先调用 connect({ uid })"); return () => {}; }
        await this.ensureConnected();
        const dest = `/topic/chat/conversations/${conversationId}`;
        const sub: StompSubscription = this.client.subscribe(dest, (msg: IMessage) => {
            try { handler(msg.body); } catch (e) { console.warn("[chatSocket] handler error", e); }
        });
        return () => { try { sub.unsubscribe(); } catch {} };
    }

    /** 读回执（若后端有该主题则生效） */
    async subscribeRead(conversationId: string, handler: (e: ReadReceiptEvent) => void): Promise<() => void> {
        if (!this.client) return () => {};
        await this.ensureConnected();
        const dest = `/topic/chat/conversations/${conversationId}/read`;
        const sub: StompSubscription = this.client.subscribe(dest, (msg: IMessage) => {
            try { handler(JSON.parse(msg.body) as ReadReceiptEvent); } catch {}
        });
        return () => { try { sub.unsubscribe(); } catch {} };
    }

    /** ✅ 新增：订阅个人收件箱变化（列表据此刷新） */
    async subscribeInbox(handler: MsgHandler): Promise<() => void> {
        if (!this.client) { console.warn("[chatSocket] 请先调用 connect({ uid })"); return () => {}; }
        await this.ensureConnected();
        const dest = `/user/queue/chat`;
        const sub: StompSubscription = this.client.subscribe(dest, (msg: IMessage) => {
            try { handler(msg.body); } catch (e) { console.warn("[chatSocket] inbox handler error", e); }
        });
        return () => { try { sub.unsubscribe(); } catch {} };
    }
}

const chatSocket = new ChatSocket();
export default chatSocket;
