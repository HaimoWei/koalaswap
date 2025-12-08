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

    // Listen for screen size changes
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

    // When conversation changes, immediately refresh list to update unread badges
    useEffect(() => {
        if (selectedId) {
            console.log('[ChatPage] conversation switched to:', selectedId, 'refresh conversation list immediately');
            qc.invalidateQueries({ queryKey: ["conversations"] });
        }
    }, [selectedId, qc]);

    // Mobile: show either list or detail, not both
    if (isMobile) {
        return (
            <div className="flex flex-col h-[calc(100vh-72px)] bg-[var(--color-bg)]">
                {selectedId ? (
                    <div className="flex-1 flex flex-col">
                        {/* Mobile header with back button */}
                        <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 py-3 flex items-center shadow-sm">
                            <button 
                                onClick={handleCloseChat}
                                className="mr-3 p-2 rounded-full hover:bg-[var(--color-muted)] active:brightness-95 transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h2 className="text-lg font-semibold text-gray-900">Chat</h2>
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

    // Desktop: two-column layout
    return (
        <div className="flex h-[calc(100vh-72px)] bg-[var(--color-muted)]">
            {/* Left: conversation list */}
            <div className="w-80 bg-[var(--color-surface)] border-r border-[var(--color-border)] shadow-sm flex-shrink-0">
                <ConversationList 
                    selectedId={selectedId}
                    onSelectConversation={handleSelectConversation}
                    isMobile={false}
                />
            </div>
            
            {/* Right: chat area */}
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
