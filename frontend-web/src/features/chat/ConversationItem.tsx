import { type ConversationListItem } from "../../api/chat";

interface ConversationItemProps {
    conversation: ConversationListItem;
    isSelected: boolean;
    onClick: () => void;
}

export function ConversationItem({ conversation, isSelected, onClick }: ConversationItemProps) {
    const peerName = conversation.peerNickname || `User ${conversation.peerUserId?.slice(0, 8)}`;
    const preview = conversation.lastMessagePreview || "";
    const hasOrderStatus = conversation.orderStatus && conversation.orderStatus !== 'PENDING';
    
    // Format relative time
    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        const diffDays = diffHours / 24;
        
        if (diffHours < 1) {
            return "Just now";
        } else if (diffHours < 24) {
            return `${Math.floor(diffHours)} hours ago`;
        } else if (diffDays < 7) {
            return `${Math.floor(diffDays)} days ago`;
        } else {
            return date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
        }
    };

    return (
        <div 
            className={`
                flex items-center p-3 mx-2 my-1 cursor-pointer rounded-lg transition-colors
                hover:bg-[var(--color-muted)] active:bg-[var(--color-secondary-50)]
                ${isSelected 
                    ? 'bg-[var(--color-secondary-50)] border-r-2 border-r-[var(--color-secondary-700)] shadow-[var(--shadow-1)]' 
                    : ''
                }
            `}
            onClick={onClick}
        >
            {/* Avatar */}
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--color-muted)] flex items-center justify-center overflow-hidden">
                {conversation.peerAvatar ? (
                    <img 
                        src={conversation.peerAvatar} 
                        alt={peerName} 
                        className="w-full h-full object-cover" 
                    />
                ) : (
                    <span className="text-gray-500 text-sm font-medium">
                        {peerName.slice(0, 1)}
                    </span>
                )}
            </div>
            
            {/* Main content */}
            <div className="ml-3 flex-1 min-w-0">
                {/* Top row: name, pin, order status, time */}
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2 min-w-0">
                        <span className={`font-medium truncate ${isSelected ? 'text-[var(--color-text-strong)]' : 'text-gray-900'}`}>
                            {peerName}
                        </span>
                        {conversation.pinnedAt && (
                            <span className="text-xs text-[var(--warning)] flex-shrink-0">📌</span>
                        )}
                        {hasOrderStatus && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--info-bg)] text-[var(--info)] flex-shrink-0">
                                {conversation.orderStatus?.toLowerCase()}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                        <span className="text-xs text-gray-400">
                            {conversation.lastMessageAt && formatTime(conversation.lastMessageAt)}
                        </span>
                    </div>
                </div>
                
                {/* Bottom row: message preview, unread badge */}
                <div className="flex items-center justify-between">
                    <span className={`text-sm truncate ${isSelected ? 'text-[var(--color-text)]' : 'text-gray-600'}`}>
                        {preview || "No messages yet..."}
                    </span>
                    {conversation.unread > 0 && (
                        <span className="ml-2 text-xs px-2 py-1 rounded-full bg-red-500 text-white min-w-[20px] text-center flex-shrink-0">
                            {conversation.unread > 99 ? '99+' : conversation.unread}
                        </span>
                    )}
                </div>
            </div>

            {/* Product image */}
            {conversation.productFirstImage && (
                <div className="ml-2 flex-shrink-0 w-14 h-14 rounded-md bg-[var(--color-muted)] overflow-hidden border border-[var(--color-border)]">
                    <img 
                        src={conversation.productFirstImage} 
                        alt={conversation.productTitle || "Item image"} 
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                </div>
            )}
        </div>
    );
}
