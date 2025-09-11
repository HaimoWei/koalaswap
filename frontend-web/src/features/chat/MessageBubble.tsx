import type { MessageResponse } from "../../api/chat";
import { useAuthStore } from "../../store/auth";

// 单条消息气泡（文本/图片）
export function MessageBubble({ m, isRead }: { m: MessageResponse; isRead?: boolean }) {
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

    return (
        <div className={`flex ${mine ? "justify-end" : "justify-start"} my-1`}>
            <div className={`max-w-[70%] rounded-2xl px-3 py-2 border ${mine ? "bg-black text-white border-black" : "bg-white border-gray-200"}`}>
                {m.type === "TEXT" && (
                    <div className="text-sm whitespace-pre-wrap break-words">
                        {m.body || "[空消息]"}
                    </div>
                )}
                {m.type === "IMAGE" && (
                    <img src={m.imageUrl || ""} className="rounded-lg max-h-64 object-contain" />
                )}
                {/* “已读”标记：仅对自己发的最后一条显示 */}
                {mine && isRead && (
                    <div className={`text-[10px] mt-1 ${mine ? "text-gray-300" : "text-gray-500"}`}>已读</div>
                )}
            </div>
        </div>
    );
}
