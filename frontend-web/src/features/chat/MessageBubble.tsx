import type { MessageResponse } from "../../api/chat";
import { useAuthStore } from "../../store/auth";

interface MessageBubbleProps {
    m: MessageResponse;
    isRead?: boolean;
    myAvatar?: string | null;
    peerAvatar?: string | null;
    peerName?: string;
}

// 单条消息气泡（文本/图片）
export function MessageBubble({ m, isRead, myAvatar, peerAvatar, peerName }: MessageBubbleProps) {
    const myId = useAuthStore((s) => s.profile?.id);
    const mine = m.senderId === myId;
    
    console.log(`[MessageBubble] 渲染消息:`, { 
        messageId: m.id, 
        senderId: m.senderId, 
        myId, 
        mine, 
        type: m.type, 
        body: m.body, 
        bodyType: typeof m.body,
        bodyLength: m.body?.length,
        imageUrl: m.imageUrl,
        createdAt: m.createdAt
    });

    if (m.type === "SYSTEM") {
        return (
            <div className="text-xs text-gray-500 text-center my-2">
                {m.body || "系统消息"}
            </div>
        );
    }

    // 头像组件
    const Avatar = ({ avatarUrl, displayName, isMine }: { avatarUrl?: string | null, displayName?: string, isMine: boolean }) => (
        <div className="w-8 h-8 rounded-full bg-[var(--color-muted)] flex items-center justify-center overflow-hidden flex-shrink-0">
            {avatarUrl ? (
                <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                />
            ) : (
                <span className="text-gray-500 text-xs font-medium">
                    {displayName?.slice(0, 1) || (isMine ? "我" : "TA")}
                </span>
            )}
        </div>
    );

    return (
        <div className={`flex ${mine ? "justify-end" : "justify-start"} my-2`}>
            {/* 对方头像（左侧） */}
            {!mine && (
                <div className="mr-2">
                    <Avatar avatarUrl={peerAvatar} displayName={peerName} isMine={false} />
                </div>
            )}

            <div className={`max-w-[70%] rounded-2xl px-3 py-2 border ${mine ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" : "bg-[var(--color-surface)] border-[var(--color-border)] shadow-[var(--shadow-1)]"}`}>
                {m.type === "TEXT" && (
                    <div className="text-sm whitespace-pre-wrap break-words">
                        {m.body || "[空消息]"}
                    </div>
                )}
                {m.type === "IMAGE" && (
                    <img src={m.imageUrl || ""} className="rounded-lg max-h-64 object-contain" />
                )}
                {/* "已读"标记：仅对自己发的最后一条显示 */}
                {mine && isRead && (
                    <div className={`text-[10px] mt-1 ${mine ? "text-gray-200" : "text-gray-500"}`}>已读</div>
                )}
            </div>

            {/* 自己的头像（右侧） */}
            {mine && (
                <div className="ml-2">
                    <Avatar avatarUrl={myAvatar} displayName="我" isMine={true} />
                </div>
            )}
        </div>
    );
}
