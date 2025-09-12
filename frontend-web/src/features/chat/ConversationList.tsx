import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listConversations } from "../../api/chat";
import { ConversationItem } from "./ConversationItem";
import { getStomp, subscribeUserInbox } from "../../ws/stomp";

interface ConversationListProps {
    selectedId: string | null;
    onSelectConversation: (id: string) => void;
    isMobile?: boolean;
}

export function ConversationList({ 
    selectedId, 
    onSelectConversation, 
    isMobile = false 
}: ConversationListProps) {
    const qc = useQueryClient();
    const q = useQuery({
        queryKey: ["conversations"],
        queryFn: () => listConversations({ page: 0, size: 50, aggregate: true }),
        refetchInterval: 15000, // 保留轮询作为兜底，但主要依赖WebSocket实时更新
    });

    // 桌面端自动选择第一个会话（如果没有选中任何会话）
    useEffect(() => {
        if (!isMobile && !selectedId && q.data?.content && q.data.content.length > 0) {
            // 优先选择有未读消息的会话，否则选择最新的会话
            const firstUnread = q.data.content.find(c => c.unread > 0);
            const target = firstUnread || q.data.content[0];
            onSelectConversation(target.id);
        }
    }, [q.data?.content, selectedId, isMobile, onSelectConversation]);

    // 监听用户收件箱变化（未读数变化、新会话等）
    useEffect(() => {
        console.log('[ConversationList] 启动收件箱变化监听');
        
        // 激活WebSocket客户端
        getStomp();

        const inboxSubscription = subscribeUserInbox((msg) => {
            console.log('[ConversationList] 收到收件箱变化通知:', msg);
            
            try {
                // 收件箱变化时，立即刷新会话列表
                qc.invalidateQueries({ queryKey: ["conversations"] });
                console.log('[ConversationList] 已刷新会话列表缓存');
            } catch (error) {
                console.error('[ConversationList] 处理收件箱变化失败:', error);
            }
        });

        return () => {
            console.log('[ConversationList] 清理收件箱变化监听');
            inboxSubscription?.unsubscribe();
        };
    }, [qc]);

    return (
        <div className="flex flex-col h-full">
            {/* 顶部标题和搜索 */}
            <div className="px-4 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                <h1 className="text-xl font-semibold mb-3">消息</h1>
                <div className="relative">
                    <input 
                        type="text"
                        placeholder="搜索会话..." 
                        className="input text-sm"
                    />
                    <svg 
                        className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>
            
            {/* 会话列表 */}
            <div className="flex-1 overflow-y-auto">
                {q.isLoading ? (
                    <div className="space-y-1">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-16 bg-[var(--color-muted)] animate-pulse mx-2 mt-2 rounded-lg" />
                        ))}
                    </div>
                ) : q.isError ? (
                    <div className="p-4 text-center text-red-600 text-sm">
                        加载失败：{(q.error as Error).message}
                    </div>
                ) : (q.data?.content.length ?? 0) === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                        暂无会话
                    </div>
                ) : (
                    <div className="py-1">
                        {q.data!.content.map((conversation) => (
                            <ConversationItem
                                key={conversation.id}
                                conversation={conversation}
                                isSelected={conversation.id === selectedId}
                                onClick={() => onSelectConversation(conversation.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
