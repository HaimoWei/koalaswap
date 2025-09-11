import { useQuery } from "@tanstack/react-query";
import { listConversations, type ConversationListItem } from "../api/chat";
import { Link } from "react-router-dom";

function ConversationItem({ c }: { c: ConversationListItem }) {
    const preview = c.lastMessagePreview || "";
    const peerName = c.peerNickname || `用户${c.peerUserId?.slice(0,8)}`;
    const hasOrderStatus = c.orderStatus && c.orderStatus !== 'PENDING';
    
    return (
        <Link to={`/chat/${c.id}`} className="p-3 border rounded-lg bg-white flex items-center space-x-3 hover:bg-gray-50">
            {/* 头像区域 */}
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                {c.peerAvatar ? (
                    <img src={c.peerAvatar} alt={peerName} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-gray-500 text-sm font-medium">{peerName.slice(0,1)}</span>
                )}
            </div>
            
            {/* 主要内容 */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                    <span className="font-medium truncate">{peerName}</span>
                    {c.pinnedAt && (
                        <span className="text-xs text-orange-500">📌</span>
                    )}
                    {hasOrderStatus && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                            {c.orderStatus?.toLowerCase()}
                        </span>
                    )}
                </div>
                <div className="text-xs text-gray-600 truncate mt-1">{preview}</div>
                {c.lastMessageAt && (
                    <div className="text-xs text-gray-400 mt-1">
                        {new Date(c.lastMessageAt).toLocaleDateString()}
                    </div>
                )}
            </div>

            {/* 右侧状态 */}
            <div className="flex-shrink-0 flex flex-col items-end space-y-1">
                {c.unread > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white min-w-[20px] text-center">
                        {c.unread > 99 ? '99+' : c.unread}
                    </span>
                )}
            </div>
        </Link>
    );
}

export function ChatListPage() {
    const q = useQuery({
        queryKey: ["conversations"],
        queryFn: () => listConversations({ page: 0, size: 50, aggregate: true }),
        refetchInterval: 15000, // 简易轮询；高级做法可订阅 /user/{uid}/queue/chat
    });

    return (
        <main className="max-w-4xl mx-auto p-6 space-y-3">
            <h1 className="text-xl font-semibold">消息</h1>

            {q.isLoading ? (
                <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_,i) => <div key={i} className="h-16 bg-white border rounded-lg animate-pulse" />)}
                </div>
            ) : q.isError ? (
                <div className="text-red-600">加载失败：{(q.error as Error).message}</div>
            ) : (q.data?.content.length ?? 0) === 0 ? (
                <div className="text-sm text-gray-600">暂无会话</div>
            ) : (
                <div className="space-y-2">
                    {q.data!.content.map((c) => <ConversationItem key={c.id} c={c} />)}
                </div>
            )}
        </main>
    );
}
