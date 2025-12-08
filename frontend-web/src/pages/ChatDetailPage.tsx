import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getConversation, listMessages,
    sendTextMessage, sendImageMessage, markRead,
    type MessageResponse,
    type ConversationDetailResponse,
} from "../api/chat";
import type { Page } from "../api/types"; // 你的项目里 Page<T> 的定义（有 content/number/totalPages）
import { getStomp, subscribeConversationMessages, subscribeConversationRead } from "../ws/stomp";
import { MessageBubble } from "../features/chat/MessageBubble";
import { MessageInput } from "../features/chat/MessageInput";
import { useAuthStore } from "../store/auth";

// 辅助：从会话详情中获取对方的已读消息ID（后端直接提供 peerReadToMessageId）
function getPeerReadToMessageId(convDetail?: ConversationDetailResponse | null): string | null {
    return convDetail?.peerReadToMessageId || null;
}

export function ChatDetailPage() {
    const { id = "" } = useParams<{ id: string }>();
    const qc = useQueryClient();
    const myId = useAuthStore((s) => s.profile?.id);

    // ====== 1) 会话详情（拿到 participants->readTo） ======
    const convQ = useQuery<ConversationDetailResponse>({
        queryKey: ["conv", id],
        queryFn: () => getConversation(id),
        enabled: !!id,
        refetchOnWindowFocus: false,
    });

    // ====== 2) 消息加载：从最新页开始，向前加载历史消息 ======
    const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set([0]));
    const [allMessages, setAllMessages] = useState<MessageResponse[]>([]);
    const [totalPages, setTotalPages] = useState<number>(1);
    const size = 30;

    // 首次加载最新的消息（第0页）
    const msgsQ = useQuery<Page<MessageResponse>>({
        queryKey: ["msgs", id, 0, size],
        queryFn: () => listMessages({ id, page: 0, size }),
        enabled: !!id,
        refetchOnWindowFocus: false,
    });

    // 处理消息数据更新
    useEffect(() => {
        if (msgsQ.data) {
            setAllMessages(msgsQ.data.content);
            setTotalPages(msgsQ.data.totalPages);
            setLoadedPages(new Set([0]));
        }
    }, [msgsQ.data]);

    // Load more historical messages
    const loadMoreHistory = async () => {
        const nextPage = Math.max(...loadedPages) + 1;
        if (nextPage >= totalPages) return;

        try {
            const data = await listMessages({ id, page: nextPage, size });
            setAllMessages(prev => [...data.content, ...prev]); // prepend historical messages
            setLoadedPages(prev => new Set([...prev, nextPage]));
        } catch (error) {
            console.error('Failed to load historical messages:', error);
        }
    };

    const hasMoreHistory = Math.max(...loadedPages, -1) + 1 < totalPages;

    // ====== 3) WebSocket real-time messages (enterprise-grade auth) ======
    useEffect(() => {
        if (!id) return;
        
        console.log('[WebSocket] 启动实时消息订阅');
        // 激活WebSocket客户端
        getStomp();

        const subs1 = subscribeConversationMessages(id, (msg) => {
            console.log('[WebSocket] 收到原始WebSocket消息:', msg);
            console.log('[WebSocket] msg.body类型:', typeof msg.body);
            console.log('[WebSocket] msg.body内容:', JSON.stringify(msg.body, null, 2));
            
            try {
                // msg.body 就是完整的 MessageResponse 对象
                let newMessage: MessageResponse;
                
                if (typeof msg.body === 'string') {
                    // 如果后端发送的是JSON字符串，需要解析
                    console.log('[WebSocket] 消息体是JSON字符串，解析为对象');
                    newMessage = JSON.parse(msg.body);
                } else if (typeof msg.body === 'object' && msg.body !== null) {
                    // 如果后端直接发送对象（最常见情况）
                    console.log('[WebSocket] 消息体是对象，直接使用');
                    newMessage = msg.body as MessageResponse;
                } else {
                    console.error('[WebSocket] 无法识别的msg.body类型:', typeof msg.body, msg.body);
                    return;
                }
                
                console.log('[WebSocket] 解析后的MessageResponse:', newMessage);
                console.log('[WebSocket] 消息ID:', newMessage.id);
                console.log('[WebSocket] 消息类型:', newMessage.type);
                console.log('[WebSocket] 消息文本内容 (newMessage.body):', newMessage.body);
                console.log('[WebSocket] 图片URL:', newMessage.imageUrl);
                console.log('[WebSocket] 发送者ID:', newMessage.senderId);
                console.log('[WebSocket] 创建时间:', newMessage.createdAt);
                
                // 验证消息对象是否有效
                if (!newMessage.id || !newMessage.type) {
                    console.error('[WebSocket] 消息对象无效，缺少必要字段:', newMessage);
                    return;
                }
                
                // 将新消息添加到列表末尾
                setAllMessages(prev => {
                    // 避免重复添加同一条消息
                    const exists = prev.find(m => m.id === newMessage.id);
                    if (exists) {
                        console.log('[WebSocket] 消息已存在，跳过:', newMessage.id);
                        return prev;
                    }
                    console.log('[WebSocket] 添加新消息到列表:', newMessage);
                    return [...prev, newMessage];
                });
            } catch (error) {
                console.error('[WebSocket] 处理新消息失败:', error);
                console.error('[WebSocket] 原始消息:', msg);
                // 如果处理失败，重新加载第一页作为兜底
                qc.invalidateQueries({ queryKey: ["msgs", id, 0, size] });
            }
        });
        
        const subs2 = subscribeConversationRead(id, (msg) => {
            console.log('[WebSocket] 收到已读回执:', msg);
            // 对方已读指针变化 → 刷新会话详情
            qc.invalidateQueries({ queryKey: ["conv", id] });
        });

        return () => {
            console.log('[WebSocket] 清理订阅');
            subs1?.unsubscribe();
            subs2?.unsubscribe();
        };
    }, [id, qc, size]);

    // ====== 4) 进入会话 → 上报已读 ======
    useEffect(() => {
        const last = allMessages[allMessages.length - 1];
        if (last) {
            markRead(id, last.id).catch(() => {});
        }
    }, [id, allMessages.length]); // 当新消息进来或首次加载时上报

    // ====== 5) 发送消息（处理 429 限流） ======
    const [sending, setSending] = useState(false);
    async function doSendText(t: string) {
        try {
            setSending(true);
            const sentMessage = await sendTextMessage(id, t);
            
            // 发送成功后，立即将消息添加到列表（乐观更新）
            setAllMessages(prev => {
                // 避免重复添加（WebSocket可能也会推送这条消息）
                if (prev.find(m => m.id === sentMessage.id)) {
                    return prev;
                }
                return [...prev, sentMessage];
            });
        } catch (e: any) {
            if (e?.response?.status === 429) {
                alert("You are sending messages too quickly. Please try again in a moment.");
            } else {
                alert(e?.message || "Failed to send message.");
            }
        } finally {
            setSending(false);
        }
    }
    async function doSendImage(u: string) {
        try {
            setSending(true);
            const sentMessage = await sendImageMessage(id, u);
            
            // 发送成功后，立即将消息添加到列表（乐观更新）
            setAllMessages(prev => {
                // 避免重复添加（WebSocket可能也会推送这条消息）
                if (prev.find(m => m.id === sentMessage.id)) {
                    return prev;
                }
                return [...prev, sentMessage];
            });
        } catch (e: any) {
            if (e?.response?.status === 429) {
                alert("You are sending messages too quickly. Please try again in a moment.");
            } else {
                alert(e?.message || "Failed to send message.");
            }
        } finally {
            setSending(false);
        }
    }

    // ====== 6) Read indicator: get peer read-to message ID from backend ======
    const peerReadToMessageId = useMemo(
        () => getPeerReadToMessageId(convQ.data),
        [convQ.data]
    );
    // Find my last message
    const lastMineIdx = [...allMessages].map((m, i) => [m, i] as const).filter(([m]) => m.senderId === myId).map(([,i]) => i).pop();
    const lastMineId = lastMineIdx != null ? allMessages[lastMineIdx].id : null;
    
    // Determine whether my last message has been read by the peer (UUIDs are compared by strict equality)
    const lastMineRead = !!(peerReadToMessageId && lastMineId && lastMineId === peerReadToMessageId);

    // Auto-scroll to bottom
    const messagesEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [allMessages.length]);

    return (
        <main className="max-w-6xl mx-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left: conversation sidebar entry */}
                <div className="md:col-span-1 space-y-3">
                    <Link to="/chat" className="block px-3 py-2 rounded card hover:shadow-[var(--shadow-2)] text-sm">
                        ← Back to messages
                    </Link>
                    {convQ.isLoading ? (
                        <div className="h-24 card animate-pulse" />
                    ) : convQ.isError ? (
                        <div className="text-red-600 text-sm">Failed to load conversation info</div>
                    ) : (
                        <div className="card p-3">
                            <div className="text-sm text-gray-600">Conversation ID</div>
                            <div className="text-sm font-mono">{id}</div>
                        </div>
                    )}
                </div>

                {/* Right: chat window */}
                <div className="md:col-span-2 card flex flex-col h-[70vh]">
                    {/* Top bar */}
                    <div className="px-4 py-3 border-b border-[var(--color-border)] text-sm">Chat</div>

                    {/* Messages area */}
                    <div className="flex-1 overflow-y-auto px-3 py-2">
                        {/* Load more history */}
                        {hasMoreHistory && (
                            <div className="flex justify-center my-2">
                                <button
                                    className="btn btn-secondary text-xs"
                                    onClick={loadMoreHistory}
                                >
                                    Load earlier messages
                                </button>
                            </div>
                        )}

                        {allMessages.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">No messages yet. Start chatting!</div>
                        ) : (
                            allMessages.map((m, i) => {
                                console.log(`[Debug] 消息 ${i}:`, { id: m.id, senderId: m.senderId, myId, type: m.type, body: m.body });
                                return (
                                    <MessageBubble
                                        key={m.id}
                                        m={m}
                                        // Only show "read" on my last message
                                        isRead={i === lastMineIdx && lastMineRead}
                                    />
                                );
                            })
                        )}
                        
                        {/* 自动滚动定位点 */}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* 输入区 */}
                    <MessageInput onSendText={doSendText} onSendImage={doSendImage} sending={sending} />
                </div>
            </div>
        </main>
    );
}
