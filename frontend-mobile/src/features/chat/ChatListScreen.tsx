// src/features/chat/ChatListScreen.tsx
import React from "react";
import { View, Text, FlatList, Image, Pressable, RefreshControl } from "react-native";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { ChatService } from "../../services/chat";
import type { ConversationListItem } from "../../types/chat";
import ConversationActions from "./components/ConversationActions";
import { useChatBadge } from "../../context/ChatBadgeContext";

function timeText(s?: string | null) {
    if (!s) return "";
    const d = new Date(s);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
}
function statusText(s?: string | null) {
    switch (s) {
        case "PENDING": return "待付款";
        case "PAID": return "已支付";
        case "SHIPPED": return "已发货";
        case "COMPLETED": return "已完成";
        case "CANCELLED": return "已取消";
        default: return "";
    }
}
// 兼容不同分页字段（page/number/totalPages）
function normalizePage<T>(res: any): { content: T[]; pageIndex: number; totalPages: number } {
    const content: T[] = Array.isArray(res) ? res : (res?.content ?? []);
    const pageIndex: number =
        typeof res?.page === "number" ? res.page :
            typeof res?.number === "number" ? res.number : 0;
    const totalPages: number = typeof res?.totalPages === "number" ? res.totalPages : 1;
    return { content, pageIndex, totalPages };
}
// 软删过滤
function sanitize(list: ConversationListItem[]) {
    return list.filter((x: any) => !x?.deletedAt && !x?.deleted_at);
}

export default function ChatListScreen() {
    const nav = useNavigation<any>();
    const isFocused = useIsFocused();
    const { setTotalUnread } = useChatBadge();

    const [items, setItems] = React.useState<ConversationListItem[]>([]);
    const [pageIndex, setPageIndex] = React.useState(0);
    const [totalPages, setTotalPages] = React.useState(1);
    const [refreshing, setRefreshing] = React.useState(false);
    const [loadingMore, setLoadingMore] = React.useState(false);

    const [actionTarget, setActionTarget] = React.useState<ConversationListItem | null>(null);

    const load = React.useCallback(async (p = 0, append = false) => {
        const res = await ChatService.listConversations({ page: p, size: 20, aggregate: true });
        const norm = normalizePage<ConversationListItem>(res);
        const pageData = sanitize(norm.content);
        if (append) {
            setItems(prev => [...prev, ...pageData]);
        } else {
            setItems(pageData);
        }
        setPageIndex(norm.pageIndex);
        setTotalPages(norm.totalPages);
    }, []);

    React.useEffect(() => { load(0, false); }, [load]);
    React.useEffect(() => { if (isFocused) load(0, false); }, [isFocused, load]);

    // ✅ items 变化后更新总未读
    React.useEffect(() => {
        const sum = items.reduce((acc, it) => acc + (it.unread || 0), 0);
        setTotalUnread(sum);
    }, [items, setTotalUnread]);

    const onRefresh = async () => {
        setRefreshing(true);
        await load(0, false);
        setRefreshing(false);
    };
    const onEnd = async () => {
        if (loadingMore) return;
        if (pageIndex + 1 >= totalPages) return;
        setLoadingMore(true);
        await load(pageIndex + 1, true);
        setLoadingMore(false);
    };

    const openChat = (it: ConversationListItem) => {
        // 先把该会话本地未读清零（徽标由 useEffect 联动）
        setItems(prev => prev.map(x => x.id === it.id ? { ...x, unread: 0 } : x));
        nav.navigate("ChatDetail", {
            conversationId: it.id,
            seed: {
                productFirstImage: it.productFirstImage,
                orderStatus: it.orderStatus,
                // 👇 新增：把对方昵称/头像一并传给详情，用于顶部与气泡头像显示
                peerNickname: it.peerNickname ?? null,
                peerAvatar: it.peerAvatar ?? null,
            },
        });
    };

    const refreshAfterAction = async () => { await load(0, false); };

    return (
        <View style={{ flex: 1 }}>
            <FlatList
                data={items}
                keyExtractor={(i) => i.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                onEndReachedThreshold={0.3}
                onEndReached={onEnd}
                renderItem={({ item }) => (
                    <Pressable
                        onPress={() => openChat(item)}
                        onLongPress={() => setActionTarget(item)}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            padding: 12,
                            borderBottomWidth: 1,
                            borderColor: "#eee",
                            gap: 12,
                            backgroundColor: item.archived ? "#fafafa" : "#fff",
                        }}
                    >
                        {/* 头像 */}
                        {item.peerAvatar ? (
                            <Image source={{ uri: item.peerAvatar }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                        ) : (
                            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#ddd", alignItems: "center", justifyContent: "center" }}>
                                <Text style={{ color: "#666" }}>{(item.peerNickname || "?").slice(0, 1)}</Text>
                            </View>
                        )}

                        {/* 文本区 */}
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                    <Text style={{ fontSize: 16, fontWeight: "600" }}>{item.peerNickname || "对方"}</Text>
                                    {item.pinnedAt ? (
                                        <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, backgroundColor: "#fff3cd", borderWidth: 1, borderColor: "#ffe08a" }}>
                                            <Text style={{ fontSize: 10, color: "#8a6d3b" }}>置顶</Text>
                                        </View>
                                    ) : null}
                                    {item.orderStatus ? (
                                        <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, backgroundColor: "#f0f7ff", borderWidth: 1, borderColor: "#cfe7ff" }}>
                                            <Text style={{ fontSize: 10, color: "#3b77d3" }}>{statusText(item.orderStatus)}</Text>
                                        </View>
                                    ) : null}
                                </View>
                                <Text style={{ color: "#999" }}>{timeText(item.lastMessageAt)}</Text>
                            </View>

                            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                                {item.productFirstImage ? (
                                    <Image source={{ uri: item.productFirstImage }} style={{ width: 18, height: 18, borderRadius: 2, marginRight: 6 }} />
                                ) : null}
                                <Text numberOfLines={1} style={{ color: "#666", flex: 1 }}>
                                    {item.lastMessagePreview || "暂无消息"}
                                </Text>
                            </View>
                        </View>

                        {/* 未读 */}
                        {item.unread > 0 ? (
                            <View style={{ minWidth: 20, paddingHorizontal: 6, height: 20, borderRadius: 10, backgroundColor: "#ff4d4f", alignItems: "center", justifyContent: "center" }}>
                                <Text style={{ color: "#fff", fontSize: 12 }}>{item.unread > 99 ? "99+" : item.unread}</Text>
                            </View>
                        ) : null}
                    </Pressable>
                )}
                ListEmptyComponent={
                    <View style={{ padding: 24, alignItems: "center" }}>
                        <Text style={{ color: "#888" }}>还没有会话</Text>
                    </View>
                }
            />

            {/* 操作面板 */}
            <ConversationActions
                visible={!!actionTarget}
                onClose={() => setActionTarget(null)}
                archived={!!actionTarget?.archived}
                pinned={!!actionTarget?.pinnedAt}
                onPin={async () => { if (actionTarget) { await ChatService.pin(actionTarget.id, !actionTarget.pinnedAt); await refreshAfterAction(); } }}
                onArchive={async () => { if (actionTarget) { await ChatService.archive(actionTarget.id, !actionTarget.archived); await refreshAfterAction(); } }}
                onMute={async () => { if (actionTarget) { await ChatService.mute(actionTarget.id, 30); await refreshAfterAction(); } }}
                onDelete={async () => { if (actionTarget) { await ChatService.delete(actionTarget.id); await refreshAfterAction(); } }}
            />
        </View>
    );
}
