import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getConversation, listMessages,
    sendTextMessage, sendImageMessage, markRead,
    type MessageResponse,
    type ConversationDetailResponse,
} from "../../api/chat";
import type { Page } from "../../api/types";
import { getStomp, subscribeConversationMessages, subscribeConversationRead } from "../../ws/stomp";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { OrderInfoModule } from "./OrderInfoModule";
import { useAuthStore } from "../../store/auth";

interface ChatDetailProps {
    conversationId: string;
}

// 辅助：从会话详情中获取对方的已读消息ID（后端直接提供 peerReadToMessageId）
function getPeerReadToMessageId(convDetail?: ConversationDetailResponse | null): string | null {
    return convDetail?.peerReadToMessageId || null;
}

export function ChatDetail({ conversationId }: ChatDetailProps) {
    const qc = useQueryClient();
    const myId = useAuthStore((s) => s.profile?.id);

    // ====== 1) 会话详情（拿到 participants->readTo） ======
    const convQ = useQuery<ConversationDetailResponse>({
        queryKey: ["conv", conversationId],
        queryFn: () => getConversation(conversationId),
        enabled: !!conversationId,
        refetchOnWindowFocus: false,
    });

    // ====== 2) 消息加载：从最新页开始，向前加载历史消息 ======
    const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set([0]));
    const [allMessages, setAllMessages] = useState<MessageResponse[]>([]);
    const [totalPages, setTotalPages] = useState<number>(1);
    const size = 30;

    // 首次加载最新的消息（第0页）
    const msgsQ = useQuery<Page<MessageResponse>>({
        queryKey: ["msgs", conversationId, 0, size],
        queryFn: () => listMessages({ id: conversationId, page: 0, size }),
        enabled: !!conversationId,
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

    // 加载更多历史消息的函数
    const loadMoreHistory = async () => {
        const nextPage = Math.max(...loadedPages) + 1;
        if (nextPage >= totalPages) return;

        try {
            const data = await listMessages({ id: conversationId, page: nextPage, size });
            setAllMessages(prev => [...data.content, ...prev]); // 历史消息加到前面
            setLoadedPages(prev => new Set([...prev, nextPage]));
        } catch (error) {
            console.error('加载历史消息失败:', error);
        }
    };

    const hasMoreHistory = Math.max(...loadedPages, -1) + 1 < totalPages;

    // ====== 3) WebSocket实时消息 ======
    useEffect(() => {
        if (!conversationId) return;
        
        console.log('[WebSocket] 启动实时消息订阅');
        // 激活WebSocket客户端
        getStomp();

        const subs1 = subscribeConversationMessages(conversationId, (msg) => {
            console.log('[WebSocket] 收到原始WebSocket消息:', msg);
            
            try {
                // msg.body 就是完整的 MessageResponse 对象
                let newMessage: MessageResponse;
                
                if (typeof msg.body === 'string') {
                    console.log('[WebSocket] 消息体是JSON字符串，解析为对象');
                    newMessage = JSON.parse(msg.body);
                } else if (typeof msg.body === 'object' && msg.body !== null) {
                    console.log('[WebSocket] 消息体是对象，直接使用');
                    newMessage = msg.body as MessageResponse;
                } else {
                    console.error('[WebSocket] 无法识别的msg.body类型:', typeof msg.body, msg.body);
                    return;
                }
                
                console.log('[WebSocket] 解析后的MessageResponse:', newMessage);
                
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
                qc.invalidateQueries({ queryKey: ["msgs", conversationId, 0, size] });
            }
        });
        
        const subs2 = subscribeConversationRead(conversationId, (msg) => {
            console.log('[WebSocket] 收到已读回执:', msg);
            // 对方已读指针变化 → 刷新会话详情
            qc.invalidateQueries({ queryKey: ["conv", conversationId] });
        });

        return () => {
            console.log('[WebSocket] 清理订阅');
            subs1?.unsubscribe();
            subs2?.unsubscribe();
        };
    }, [conversationId, qc, size]);

    // ====== 4) 进入会话 → 上报已读 ======
    useEffect(() => {
        const last = allMessages[allMessages.length - 1];
        if (last) {
            // 立即上报已读，同时立即刷新会话列表缓存以更新未读徽标
            markRead(conversationId, last.id)
                .then(() => {
                    console.log('[ChatDetail] markRead成功，刷新会话列表');
                    // 立即刷新会话列表来更新未读数
                    qc.invalidateQueries({ queryKey: ["conversations"] });
                })
                .catch(() => {
                    console.error('[ChatDetail] markRead失败');
                });
        }
    }, [conversationId, allMessages, qc]); // 当新消息进来或首次加载时上报

    // ====== 4.5) 切换会话时立即标记已读 ======
    useEffect(() => {
        // 当会话ID变化时，尝试立即标记最近的消息为已读
        // 这样可以更快地清除未读徽标，提升用户体验
        if (conversationId && allMessages.length > 0) {
            const lastMessage = allMessages[allMessages.length - 1];
            console.log('[ChatDetail] 会话切换，立即标记已读:', conversationId);
            markRead(conversationId, lastMessage.id)
                .then(() => {
                    console.log('[ChatDetail] 切换会话markRead成功');
                    qc.invalidateQueries({ queryKey: ["conversations"] });
                })
                .catch(() => {
                    console.error('[ChatDetail] 切换会话markRead失败');
                });
        }
    }, [conversationId, allMessages, qc]); // 在会话ID变化或有消息时触发

    // ====== 5) 发送消息（处理 429 限流） ======
    const [sending, setSending] = useState(false);
    async function doSendText(t: string) {
        try {
            setSending(true);
            const sentMessage = await sendTextMessage(conversationId, t);
            
            // 发送成功后，立即将消息添加到列表（乐观更新）
            setAllMessages(prev => {
                // 避免重复添加（WebSocket可能也会推送这条消息）
                if (prev.find(m => m.id === sentMessage.id)) {
                    return prev;
                }
                return [...prev, sentMessage];
            });
        } catch (e: unknown) {
            if ((e as { response?: { status?: number } })?.response?.status === 429) {
                alert("发送太快啦，请稍后再试");
            } else {
                alert((e as { message?: string })?.message || "发送失败");
            }
        } finally {
            setSending(false);
        }
    }
    
    async function doSendImage(u: string) {
        try {
            setSending(true);
            const sentMessage = await sendImageMessage(conversationId, u);
            
            // 发送成功后，立即将消息添加到列表（乐观更新）
            setAllMessages(prev => {
                // 避免重复添加（WebSocket可能也会推送这条消息）
                if (prev.find(m => m.id === sentMessage.id)) {
                    return prev;
                }
                return [...prev, sentMessage];
            });
        } catch (e: unknown) {
            if ((e as { response?: { status?: number } })?.response?.status === 429) {
                alert("发送太快啦，请稍后再试");
            } else {
                alert((e as { message?: string })?.message || "发送失败");
            }
        } finally {
            setSending(false);
        }
    }

    // ====== 6) "已读"标识：从后端获取对方的已读消息ID ======
    const peerReadToMessageId = useMemo(
        () => getPeerReadToMessageId(convQ.data),
        [convQ.data]
    );
    // 找到我发的最后一条消息
    const lastMineIdx = [...allMessages].map((m, i) => [m, i] as const).filter(([m]) => m.senderId === myId).map(([,i]) => i).pop();
    const lastMineId = lastMineIdx != null ? allMessages[lastMineIdx].id : null;
    
    // 判断我的最后一条消息是否被对方已读（使用严格相等比较，因为UUID不支持大小比较）
    const lastMineRead = !!(peerReadToMessageId && lastMineId && lastMineId === peerReadToMessageId);

    // 自动滚动到底部
    const messagesEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [allMessages.length]);

    // 获取对方信息 - 通过当前用户ID推断对方ID
    const peerUserId = convQ.data && myId ?
        (myId === convQ.data.buyerId ? convQ.data.sellerId : convQ.data.buyerId) : undefined;
    const peerName = convQ.data ? (convQ.data.peerNickname || `用户${peerUserId?.slice(0, 8)}`) : "";
    // 顶部状态：优先订单详情里的状态，其次用会话缓存；不隐藏 PENDING
    const headerStatus = convQ.data ? (convQ.data.orderDetail?.status || convQ.data.orderStatus) : undefined;
    const hasOrderStatus = !!headerStatus;
    
    // 临时调试日志
    console.log('[ChatDetail] conversation data:', {
        peerNickname: convQ.data?.peerNickname,
        peerUserId,
        productTitle: convQ.data?.productTitle,
        productPrice: convQ.data?.productPrice,
        orderStatus: convQ.data?.orderStatus,
    });

    return (
        <div className="flex flex-col h-full bg-[var(--color-surface)]">
            {/* 聊天头部 - 对方信息和订单状态 */}
            <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center space-x-3">
                {/* 对方头像 */}
                <div className="w-10 h-10 rounded-full bg-[var(--color-muted)] flex items-center justify-center overflow-hidden">
                    {convQ.data?.peerAvatar ? (
                        <img 
                            src={convQ.data.peerAvatar} 
                            alt={peerName} 
                            className="w-full h-full object-cover" 
                        />
                    ) : (
                        <span className="text-gray-500 text-sm font-medium">
                            {peerName.slice(0, 1)}
                        </span>
                    )}
                </div>
                
                {/* 对方信息 */}
                <div className="flex-1">
                    <div className="flex items-center space-x-2">
                        <h2 className="font-semibold text-gray-900">
                            {convQ.isLoading ? "加载中..." : peerName}
                        </h2>
                        {hasOrderStatus && (
                            <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                                {headerStatus?.toLowerCase()}
                            </span>
                        )}
                    </div>
                </div>

                {/* 更多操作按钮 */}
                <button className="p-2 rounded-full hover:bg-[var(--color-muted)]">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                </button>
            </div>

            {/* 订单信息模块 */}
            {convQ.data && (
                <OrderInfoModule conversation={convQ.data} />
            )}

            {/* 消息列表区域 */}
            <div className="flex-1 overflow-y-auto px-4 py-3 bg-[var(--color-bg)]">
                {/* 加载更多历史消息 */}
                {hasMoreHistory && (
                    <div className="flex justify-center my-3">
                        <button
                            className="text-sm px-4 py-2 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-muted)] shadow-[var(--shadow-1)]"
                            onClick={loadMoreHistory}
                        >
                            加载更早消息
                        </button>
                    </div>
                )}

                {allMessages.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                        <div className="w-16 h-16 mx-auto mb-4 bg-[var(--color-muted)] rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <p>还没有消息，开始聊天吧！</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {allMessages.map((m, i) => {
                            console.log(`[Debug] 消息 ${i}:`, { id: m.id, senderId: m.senderId, myId, type: m.type, body: m.body });
                            return (
                                <MessageBubble
                                    key={m.id}
                                    m={m}
                                    // 仅在"我最后一条消息"处展示已读
                                    isRead={i === lastMineIdx && lastMineRead}
                                />
                            );
                        })}
                    </div>
                )}
                
                {/* 自动滚动定位点 */}
                <div ref={messagesEndRef} />
            </div>

            {/* 输入区 */}
            <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
                <MessageInput onSendText={doSendText} onSendImage={doSendImage} sending={sending} />
            </div>
        </div>
    );
}
