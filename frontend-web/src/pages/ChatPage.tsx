import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ConversationList } from "../features/chat/ConversationList";
import { ChatDetail } from "../features/chat/ChatDetail";
import { EmptyChatPlaceholder } from "../features/chat/EmptyChatPlaceholder";

export function ChatPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedId = searchParams.get('conversation');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const qc = useQueryClient();

    // 监听屏幕尺寸变化
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSelectConversation = (id: string) => {
        setSearchParams({ conversation: id });
    };

    const handleCloseChat = () => {
        setSearchParams({});
    };

    // 监听会话选择变化，立即刷新会话列表以更新未读状态
    useEffect(() => {
        if (selectedId) {
            console.log('[ChatPage] 会话切换到:', selectedId, '立即刷新会话列表');
            // 当用户选择会话时，立即刷新会话列表
            // 这样配合ChatDetail的markRead可以快速清除未读徽标
            qc.invalidateQueries({ queryKey: ["conversations"] });
        }
    }, [selectedId, qc]);

    // 移动端：显示列表或详情，不同时显示
    if (isMobile) {
        return (
            <div className="flex flex-col h-[calc(100vh-72px)] bg-[var(--color-bg)]">
                {selectedId ? (
                    <div className="flex-1 flex flex-col">
                        {/* 移动端顶部返回按钮 */}
                        <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 py-3 flex items-center shadow-sm">
                            <button 
                                onClick={handleCloseChat}
                                className="mr-3 p-2 rounded-full hover:bg-[var(--color-muted)] active:brightness-95 transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h2 className="text-lg font-semibold text-gray-900">聊天</h2>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <ChatDetail conversationId={selectedId} />
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-hidden">
                        <ConversationList 
                            selectedId={null}
                            onSelectConversation={handleSelectConversation}
                            isMobile={true}
                        />
                    </div>
                )}
            </div>
        );
    }

    // 桌面端：两列布局
    return (
        <div className="flex h-[calc(100vh-72px)] bg-[var(--color-muted)]">
            {/* 左侧会话列表 */}
            <div className="w-80 bg-[var(--color-surface)] border-r border-[var(--color-border)] shadow-sm flex-shrink-0">
                <ConversationList 
                    selectedId={selectedId}
                    onSelectConversation={handleSelectConversation}
                    isMobile={false}
                />
            </div>
            
            {/* 右侧聊天区域 */}
            <div className="flex-1 flex flex-col bg-[var(--color-surface)] shadow-sm">
                {selectedId ? (
                    <ChatDetail conversationId={selectedId} />
                ) : (
                    <EmptyChatPlaceholder />
                )}
            </div>
        </div>
    );
}
