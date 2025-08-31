import { useQuery } from "@tanstack/react-query";
import { listConversations, type ConversationListItem } from "../api/chat";
import { Link } from "react-router-dom";

function ConversationItem({ c }: { c: ConversationListItem }) {
    const last = c.lastMessage;
    const preview =
        last?.type === "IMAGE" ? "[图片]" :
            last?.type === "SYSTEM" ? (last?.body || "[系统消息]") :
                (last?.body || "");
    return (
        <Link to={`/chat/${c.id}`} className="p-3 border rounded-lg bg-white flex items-center justify-between hover:bg-gray-50">
            <div className="min-w-0">
                <div className="font-medium truncate">会话 {c.id.slice(0,8)}…</div>
                <div className="text-xs text-gray-600 truncate mt-1">{preview}</div>
            </div>
            {c.unreadCount ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white">{c.unreadCount}</span>
            ) : (
                <span className="text-xs text-gray-400">—</span>
            )}
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
