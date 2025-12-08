import type { MessageResponse } from "../../api/chat";
import { useAuthStore } from "../../store/auth";

interface MessageBubbleProps {
    m: MessageResponse;
    isRead?: boolean;
    myAvatar?: string | null;
    peerAvatar?: string | null;
    peerName?: string;
}

// Map system events to English labels
const SYSTEM_EVENT_TEXT: Record<
    NonNullable<MessageResponse["systemEvent"]>,
    string
> = {
    ORDER_PLACED: "Order placed",
    PAID: "Payment received",
    SHIPPED: "Item shipped",
    COMPLETED: "Transaction completed",
    CANCELLED: "Order cancelled",
    BUYER_REVIEWED: "Buyer has left a review",
    SELLER_REVIEWED: "Seller has left a review",
};

// Fallback mapping for legacy Chinese system texts
const LEGACY_CN_SYSTEM_TEXT: Record<string, string> = {
    "已发货": "Item shipped",
    "交易完成": "Transaction completed",
    "买家已评价": "Buyer has left a review",
    "卖家已评价": "Seller has left a review",
    "已支付": "Payment received",
    "已取消": "Order cancelled",
    "待付款": "Awaiting payment",
};

function getSystemMessageText(m: MessageResponse): string {
    const fromEvent =
        (m.systemEvent && SYSTEM_EVENT_TEXT[m.systemEvent]) || null;
    if (fromEvent) return fromEvent;

    const raw = (m.body ?? "").trim();
    if (!raw) return "System message";

    // Try to translate known legacy Chinese snippets
    for (const [cn, en] of Object.entries(LEGACY_CN_SYSTEM_TEXT)) {
        if (raw.includes(cn)) {
            // Replace CN segment with EN but keep rest, just in case
            return raw.replace(cn, en);
        }
    }

    // Fallback: show original body
    return raw;
}

// Single message bubble (text/image)
export function MessageBubble({ m, isRead, myAvatar, peerAvatar, peerName }: MessageBubbleProps) {
    const myId = useAuthStore((s) => s.profile?.id);
    const mine = m.senderId === myId;

    if (m.type === "SYSTEM") {
        return (
            <div className="text-xs text-gray-500 text-center my-2">
                {getSystemMessageText(m)}
            </div>
        );
    }

    // Avatar component
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
                    {displayName?.slice(0, 1) || (isMine ? "Me" : "User")}
                </span>
            )}
        </div>
    );

    return (
        <div className={`flex ${mine ? "justify-end" : "justify-start"} my-2`}>
            {/* Peer avatar (left) */}
            {!mine && (
                <div className="mr-2">
                    <Avatar avatarUrl={peerAvatar} displayName={peerName} isMine={false} />
                </div>
            )}

            <div className={`max-w-[70%] rounded-2xl px-3 py-2 border ${mine ? "bg-[var(--color-primary)] text-[var(--color-text-strong)] border-[var(--color-primary)]" : "bg-[var(--color-surface)] border-[var(--color-border)] shadow-[var(--shadow-1)]"}`}>
                {m.type === "TEXT" && (
                    <div className="text-sm whitespace-pre-wrap break-words">
                        {m.body || "[Empty message]"}
                    </div>
                )}
                {m.type === "IMAGE" && (
                    <img src={m.imageUrl || ""} className="rounded-lg max-h-64 object-contain" />
                )}
                {/* "Read" indicator: only for my last message */}
                {mine && isRead && (
                    <div className={`text-[10px] mt-1 ${mine ? "text-gray-200" : "text-gray-500"}`}>Read</div>
                )}
            </div>

            {/* My avatar (right) */}
            {mine && (
                <div className="ml-2">
                    <Avatar avatarUrl={myAvatar} displayName="Me" isMine={true} />
                </div>
            )}
        </div>
    );
}
