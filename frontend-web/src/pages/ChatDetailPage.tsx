import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getConversation, listMessages,
    sendTextMessage, sendImageMessage, markRead,
    type MessageResponse,
    type ConversationDetailResponse,
} from "../api/chat";
import type { Page } from "../api/types"; // 你的项目里 Page<T> 的定义（有 content/number/totalPages）
import { getStomp, subscribeConversationMessages, subscribeConversationRead } from "../ws/stomp";
import { MessageBubble } from "../features/chat/MessageBubble";
import { MessageInput } from "../features/chat/MessageInput";
import { useAuthStore } from "../store/auth";

// 辅助：从会话 participants 中找对方的 readTo
function otherReadTo(participants: { userId: string; readTo?: string | null }[], myId?: string | null) {
    if (!participants?.length || !myId) return null;
    const other = participants.find(p => p.userId !== myId);
    return other?.readTo || null;
}

export function ChatDetailPage() {
    const { id = "" } = useParams<{ id: string }>();
    const qc = useQueryClient();
    const myId = useAuthStore((s) => s.profile?.id);

    // ====== 1) 会话详情（拿到 participants->readTo） ======
    const convQ = useQuery<ConversationDetailResponse>({
        queryKey: ["conv", id],
        queryFn: () => getConversation(id),
        enabled: !!id,
        refetchOnWindowFocus: false,
    });

    // ====== 2) 消息分页（简单“加载更多旧消息”） ======
    const [page, setPage] = useState(0);
    const size = 30;

    const msgsQ = useQuery<Page<MessageResponse>>({
        queryKey: ["msgs", id, page, size],
        queryFn: () => listMessages({ id, page, size }),
        enabled: !!id,
        // v5 没有 keepPreviousData，用这个保持上一次数据不抖动
        placeholderData: (prev) => prev as any,
        refetchOnWindowFocus: false,
    });

    // 合并多页为一个数组（从旧到新显示）
    const pagesRef = useRef<Record<number, MessageResponse[]>>({});
    useEffect(() => {
        if (msgsQ.data?.content) {
            // 假设服务端按时间“倒序”返回，这里反转为“升序”。若服务端本身是升序，去掉 reverse 即可。
            pagesRef.current[page] = msgsQ.data.content.slice().reverse();
        }
    }, [page, msgsQ.data]);

    const ordered = useMemo(() => {
        const keys = Object.keys(pagesRef.current).map(Number).sort((a,b) => a - b);
        return keys.flatMap(k => pagesRef.current[k] || []);
    }, [msgsQ.data, page]);

    // ====== 3) 订阅 WS：新消息 / 读回执 ======
    useEffect(() => {
        if (!id) return;
        // 激活客户端（不接收返回值，避免未使用变量报错）
        getStomp();

        const subs1 = subscribeConversationMessages(id, () => {
            // 有新消息 → 刷第一页
            pagesRef.current = {};
            qc.invalidateQueries({ queryKey: ["msgs", id] });
        });
        const subs2 = subscribeConversationRead(id, () => {
            // 对方已读指针变化 → 刷会话详情
            qc.invalidateQueries({ queryKey: ["conv", id] });
        });

        return () => {
            subs1?.unsubscribe();
            subs2?.unsubscribe();
        };
    }, [id, qc]);

    // ====== 4) 进入会话 → 上报已读 ======
    useEffect(() => {
        const last = ordered[ordered.length - 1];
        if (last) {
            markRead(id, last.id).catch(() => {});
        }
    }, [id, ordered.length]); // 当新消息进来或首次加载时上报

    // ====== 5) 发送消息（处理 429 限流） ======
    const [sending, setSending] = useState(false);
    async function doSendText(t: string) {
        try {
            setSending(true);
            await sendTextMessage(id, t);
        } catch (e: any) {
            if (e?.response?.status === 429) {
                alert("发送太快啦，请稍后再试");
            } else {
                alert(e?.message || "发送失败");
            }
        } finally {
            setSending(false);
        }
    }
    async function doSendImage(u: string) {
        try {
            setSending(true);
            await sendImageMessage(id, u);
        } catch (e: any) {
            if (e?.response?.status === 429) {
                alert("发送太快啦，请稍后再试");
            } else {
                alert(e?.message || "发送失败");
            }
        } finally {
            setSending(false);
        }
    }

    // ====== 6) “已读”标识：自己最后一条消息是否被对方 readTo 覆盖 ======
    const otherRead = useMemo(
        () => otherReadTo(convQ.data?.participants || [], myId || null),
        [convQ.data, myId]
    );
    const lastMineIdx = [...ordered].map((m, i) => [m, i] as const).filter(([m]) => m.senderId === myId).map(([,i]) => i).pop();
    const lastMineId = lastMineIdx != null ? ordered[lastMineIdx].id : null;
    const lastMineRead = !!(otherRead && lastMineId && compareIdLe(lastMineId, otherRead));

    // ID 比较：若是自增数字字符串，直接转 number；若是 UUID，无法比较大小，这里仅做严格相等
    function compareIdLe(a: string, b: string) {
        const na = Number(a), nb = Number(b);
        if (!Number.isNaN(na) && !Number.isNaN(nb)) return na <= nb;
        return a === b;
    }

    // 是否还有更早页（基于 Page<T> 的 number/totalPages）
    const hasMore = (msgsQ.data?.number || 0) < ((msgsQ.data?.totalPages || 1) - 1);

    return (
        <main className="max-w-6xl mx-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 左：会话侧栏入口 */}
                <div className="md:col-span-1 space-y-3">
                    <Link to="/chat" className="block px-3 py-2 rounded bg-white border hover:bg-gray-50 text-sm">
                        ← 返回消息列表
                    </Link>
                    {convQ.isLoading ? (
                        <div className="h-24 bg-white border rounded animate-pulse" />
                    ) : convQ.isError ? (
                        <div className="text-red-600 text-sm">会话信息加载失败</div>
                    ) : (
                        <div className="bg-white border rounded p-3">
                            <div className="text-sm text-gray-600">会话ID</div>
                            <div className="text-sm font-mono">{id}</div>
                        </div>
                    )}
                </div>

                {/* 右：聊天窗口 */}
                <div className="md:col-span-2 bg-white border rounded flex flex-col h-[70vh]">
                    {/* 顶部条 */}
                    <div className="px-4 py-3 border-b text-sm">聊天</div>

                    {/* 消息区 */}
                    <div className="flex-1 overflow-y-auto px-3 py-2">
                        {/* 加载更多旧消息 */}
                        {hasMore && (
                            <div className="flex justify-center my-2">
                                <button
                                    className="text-xs px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    加载更早消息
                                </button>
                            </div>
                        )}

                        {ordered.map((m, i) => (
                            <MessageBubble
                                key={m.id}
                                m={m}
                                // 仅在“我最后一条消息”处展示已读
                                isRead={i === lastMineIdx && lastMineRead}
                            />
                        ))}
                    </div>

                    {/* 输入区 */}
                    <MessageInput onSendText={doSendText} onSendImage={doSendImage} sending={sending} />
                </div>
            </div>
        </main>
    );
}
