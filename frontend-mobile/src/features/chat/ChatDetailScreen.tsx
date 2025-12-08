import React from "react";
import {
    View,
    Text,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from "react-native";
import { useRoute, useIsFocused } from "@react-navigation/native";
import { ChatService } from "../../services/chat";
import { ProductService } from "../../services/products";
import { formatAUD } from "../../utils/currency";
import type { MessageResponse } from "../../types/chat";
import { useAuth } from "../../context/AuthContext";
import MessageBubble from "./components/MessageBubble";
import Composer from "./components/Composer";
import chatSocket from "../../realtime/chatSocket";

type Params = {
    conversationId: string;
    seed?: {
        productFirstImage?: string | null;
        orderStatus?: string | null;
        peerNickname?: string | null;
        peerAvatar?: string | null;
        peerReadToMessageId?: string | null;
        productId?: string | null;
        productTitle?: string | null;
        productPrice?: number | null;
    };
};

function normalizePage<T>(res: any): { content: T[]; pageIndex: number; totalPages: number } {
    const content: T[] = Array.isArray(res) ? res : (res?.content ?? []);
    const pageIndex =
        typeof res?.page === "number" ? res.page : typeof res?.number === "number" ? res.number : 0;
    const totalPages = typeof res?.totalPages === "number" ? res.totalPages : 1;
    return { content, pageIndex, totalPages };
}

function parseWsMessage(body: string): MessageResponse | null {
    try {
        const obj = JSON.parse(body);
        const maybe = obj?.data ?? obj;
        return maybe && typeof maybe.id === "string" ? (maybe as MessageResponse) : null;
    } catch {
        return null;
    }
}

export default function ChatDetailScreen() {
    const route = useRoute<any>();
    const isFocused = useIsFocused();
    const { user } = useAuth();
    const { conversationId, seed } = (route.params || {}) as Params;

    // 顶部展示信息
    const [header, setHeader] = React.useState<{
        productId?: string | null;
        image?: string | null;
        title?: string | null;
        price?: number | null;
        orderStatus?: string | null;
        peerNickname?: string | null;
        peerAvatar?: string | null;
    }>({
        productId: seed?.productId ?? null,
        image: seed?.productFirstImage ?? null,
        title: seed?.productTitle ?? null,
        price: seed?.productPrice ?? null,
        orderStatus: seed?.orderStatus ?? null,
        peerNickname: seed?.peerNickname ?? null,
        peerAvatar: seed?.peerAvatar ?? null,
    });

    const [messages, setMessages] = React.useState<MessageResponse[]>([]);
    const [pageIndex, setPageIndex] = React.useState(0);
    const [totalPages, setTotalPages] = React.useState(1);
    const [loadingMoreTop, setLoadingMoreTop] = React.useState(false);
    const [refreshing, setRefreshing] = React.useState(false);

    const flatRef = React.useRef<FlatList<MessageResponse>>(null);
    const idsRef = React.useRef<Set<string>>(new Set());
    const isFocusRef = React.useRef<boolean>(false);
    isFocusRef.current = isFocused;

    // 对方已读游标
    const [peerReadTo, setPeerReadTo] = React.useState<string | null>(
        seed?.peerReadToMessageId ?? null
    );

    // 已读去抖
    const markTimer = React.useRef<NodeJS.Timeout | null>(null);
    const lastReadIdRef = React.useRef<string | null>(null);
    const markReadDebounced = (messageId: string) => {
        lastReadIdRef.current = messageId;
        if (markTimer.current) return;
        markTimer.current = setTimeout(async () => {
            try {
                if (lastReadIdRef.current) await ChatService.markRead(conversationId, lastReadIdRef.current);
            } finally {
                markTimer.current && clearTimeout(markTimer.current);
                markTimer.current = null;
            }
        }, 500);
    };

    // === 统一去重 + 升序 ===
    const uniqueById = (list: MessageResponse[]) => {
        const map = new Map<string, MessageResponse>();
        for (const m of list) {
            if (!m?.id) continue;
            map.set(m.id, m); // 同 id 后到覆盖先到
        }
        const arr = Array.from(map.values());
        arr.sort(
            (a, b) => new Date(a.createdAt as any).getTime() - new Date(b.createdAt as any).getTime()
        );
        return arr;
    };

    const appendAsc = React.useCallback((arr: MessageResponse[], more: MessageResponse[]) => {
        const next = uniqueById([...arr, ...more]);
        idsRef.current = new Set(next.map((m) => m.id));
        return next;
    }, []);

    const prependAsc = React.useCallback((arr: MessageResponse[], older: MessageResponse[]) => {
        const next = uniqueById([...older, ...arr]);
        idsRef.current = new Set(next.map((m) => m.id));
        return next;
    }, []);

    const load = React.useCallback(
        async (p = 0, mode: "reset" | "prepend" = "reset") => {
            const res = await ChatService.getMessages(conversationId, { page: p, size: 20 });
            const norm = normalizePage<MessageResponse>(res);

            if (mode === "reset") {
                const sorted = uniqueById(norm.content);
                idsRef.current = new Set(sorted.map((m) => m.id));
                setMessages(sorted);
                setPageIndex(norm.pageIndex);
                setTotalPages(norm.totalPages);
                requestAnimationFrame(() => flatRef.current?.scrollToEnd({ animated: false }));
                if (sorted.length) markReadDebounced(sorted[sorted.length - 1].id);
            } else {
                setMessages((prev) => prependAsc(prev, norm.content));
                setPageIndex(norm.pageIndex);
                setTotalPages(norm.totalPages);
            }
        },
        [conversationId, prependAsc]
    );

    React.useEffect(() => {
        load(0, "reset");
    }, [load]);

    // 首屏拿会话详情 -> 设置已读游标/封面/状态；缺标题价格则按 productId 补齐
    React.useEffect(() => {
        (async () => {
            try {
                const d = await ChatService.getConversation(conversationId);
                setPeerReadTo((d as any).peerReadToMessageId || null);

                setHeader((prev) => ({
                    ...prev,
                    productId: prev.productId ?? (d as any).productId ?? null,
                    image: prev.image ?? (d as any).productFirstImage ?? null,
                    orderStatus: prev.orderStatus ?? (d as any).orderStatus ?? null,
                }));

                const pid: string | undefined =
                    (seed?.productId as string | undefined) || ((d as any)?.productId as string | undefined);

                if (pid && (seed?.productTitle == null || seed?.productPrice == null)) {
                    try {
                        const item = await ProductService.getById(pid);
                        const firstImage = Array.isArray(item?.images)
                            ? typeof item.images[0] === "string"
                                ? item.images[0]
                                : item.images[0]?.imageUrl
                            : undefined;
                        setHeader((prev2) => ({
                            ...prev2,
                            title: prev2.title ?? (item?.title ?? null),
                            price: prev2.price ?? (typeof item?.price === "number" ? item.price : null),
                            image: prev2.image ?? (firstImage ?? null),
                        }));
                    } catch {}
                }
            } catch {}
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId]);

    // 订阅 WS：新消息 + 读回执
    React.useEffect(() => {
        if (!user?.id) return;
        chatSocket.connect({ uid: String(user.id) });

        let unsubMsg: (() => void) | null = null;
        let unsubRead: (() => void) | null = null;
        let mounted = true;

        (async () => {
            unsubMsg = await chatSocket.subscribeConversation(conversationId, (body) => {
                if (!mounted) return;
                const m = parseWsMessage(body);
                if (!m || !m.id || idsRef.current.has(m.id)) return;

                // 如果是系统消息，顺带更新顶部状态（不影响你现有展示优先级）
                if (m.type === "SYSTEM" && (m as any).systemEvent) {
                    setHeader((prev) => ({
                        ...prev,
                        orderStatus: String((m as any).systemEvent || prev.orderStatus || ""),
                    }));
                }

                setMessages((prev) => appendAsc(prev, [m]));
                if (isFocusRef.current) markReadDebounced(m.id);
                requestAnimationFrame(() => flatRef.current?.scrollToEnd({ animated: true }));
            });

            if ((chatSocket as any).subscribeRead) {
                unsubRead = await (chatSocket as any).subscribeRead(conversationId, (evt: any) => {
                    if (String(evt?.readerId) !== String(user?.id || "")) {
                        setPeerReadTo(evt?.readTo || null);
                    }
                });
            }
        })();

        return () => {
            mounted = false;
            try {
                unsubMsg?.();
            } catch {}
            try {
                unsubRead?.();
            } catch {}
        };
    }, [user?.id, conversationId, appendAsc]);

    React.useEffect(() => {
        if (isFocused && messages.length) markReadDebounced(messages[messages.length - 1].id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFocused, messages.length, conversationId]);

    const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const y = e.nativeEvent.contentOffset.y;
        if (y <= 24 && !loadingMoreTop && pageIndex + 1 < totalPages) {
            setLoadingMoreTop(true);
            load(pageIndex + 1, "prepend").finally(() => setLoadingMoreTop(false));
        }
    };

    const refresh = async () => {
        setRefreshing(true);
        await load(0, "reset");
        setRefreshing(false);
    };

    const onSend = async (text: string) => {
        const sent = await ChatService.sendMessage(conversationId, { type: "TEXT", body: text });

        // 若 WS 已先到，这里不再追加，避免重复 key
        if (!idsRef.current.has(sent.id)) {
            setMessages((prev) => appendAsc(prev, [sent]));
        }

        requestAnimationFrame(() => flatRef.current?.scrollToEnd({ animated: true }));
        return sent;
    };

    // 顶部（商品图/标题 + 价格或状态；下方对方头像昵称轻提示）
    const Header = () => (
        <View>
            {header.image || header.title || header.price != null || header.orderStatus ? (
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 10,
                        borderBottomWidth: 1,
                        borderColor: "#eee",
                        gap: 10,
                        backgroundColor: "#fafafa",
                    }}
                >
                    {header.image ? (
                        <Image source={{ uri: header.image }} style={{ width: 40, height: 40, borderRadius: 6 }} />
                    ) : (
                        <View style={{ width: 40, height: 40, borderRadius: 6, backgroundColor: "#eee" }} />
                    )}
                    <View style={{ flex: 1 }}>
                        {header.title ? (
                            <Text numberOfLines={1} style={{ fontSize: 14, color: "#333" }}>
                                {header.title}
                            </Text>
                        ) : null}
                        <Text style={{ color: "#999", marginTop: 2 }}>
                            {header.price != null
                                ? formatAUD(header.price)
                                : header.orderStatus
                                    ? `订单：${header.orderStatus}`
                                    : "聊天中"}
                        </Text>
                    </View>
                </View>
            ) : null}

            {header.peerAvatar || header.peerNickname ? (
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        gap: 8,
                    }}
                >
                    {header.peerAvatar ? (
                        <Image source={{ uri: header.peerAvatar }} style={{ width: 22, height: 22, borderRadius: 11 }} />
                    ) : (
                        <View
                            style={{
                                width: 22,
                                height: 22,
                                borderRadius: 11,
                                backgroundColor: "#ddd",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Text style={{ fontSize: 12, color: "#666" }}>
                                {(header.peerNickname || "?").slice(0, 1)}
                            </Text>
                        </View>
                    )}
                    <Text style={{ color: "#666" }}>{header.peerNickname || "对方"}</Text>
                </View>
            ) : null}
        </View>
    );

    const myId = String(user?.id || "");
    const renderItem = ({ item, index }: { item: MessageResponse; index: number }) => {
        const me = String(item.senderId || "") === myId;
        const prev = index > 0 ? messages[index - 1] : undefined;
        const isFirstOfGroup = !prev || prev.senderId !== item.senderId;
        const isMyLast = me && index === messages.length - 1;

        const readFlag = Boolean(isMyLast && peerReadTo && item.id === peerReadTo);

        return (
            <MessageBubble
                msg={item}
                me={me}
                showAvatar={!me && isFirstOfGroup}
                showName={!me && isFirstOfGroup}
                peerAvatar={header.peerAvatar || null}
                peerNickname={header.peerNickname || null}
                showRead={readFlag}
            />
        );
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
            <FlatList
                ref={flatRef}
                data={messages}
                keyExtractor={(i) => i.id}
                ListHeaderComponent={<Header />}
                contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 8 }}
                renderItem={renderItem}
                onScroll={onScroll}
                scrollEventThrottle={16}
                refreshing={refreshing}
                onRefresh={refresh}
                ListEmptyComponent={
                    <View style={{ alignItems: "center", padding: 24 }}>
                        <Text style={{ color: "#888" }}>开始聊天吧</Text>
                    </View>
                }
                onContentSizeChange={() => {
                    if (isFocused) flatRef.current?.scrollToEnd({ animated: false });
                }}
            />
            <Composer onSend={onSend} />
        </KeyboardAvoidingView>
    );
}
