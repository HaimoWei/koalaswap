// src/features/me/PendingReviewsScreen.tsx
// 作用：待评价/可追评（最小改动：确保“可追评”展示真实商品名）
import React from "react";
import {
    View,
    Text,
    FlatList,
    Pressable,
    RefreshControl,
    Modal,
    TextInput,
    Switch,
    Alert,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import ReviewsService, {
    PendingItem,
    PendingRes,
} from "../../services/reviews";
import { ProductService } from "../../services/products";

type TabKey = "buyer" | "seller" | "commented";
type AppendableItem = PendingItem & { reviewId: string };

function SectionHeader({ title, count }: { title: string; count: number }) {
    return (
        <View
            style={{
                paddingVertical: 8,
                paddingHorizontal: 4,
                flexDirection: "row",
                justifyContent: "space-between",
            }}
        >
            <Text style={{ fontSize: 16, fontWeight: "700" }}>{title}</Text>
            <Text style={{ color: "#666" }}>{count}</Text>
        </View>
    );
}

function RatingStars({
                         value,
                         onChange,
                     }: {
    value: number;
    onChange: (n: number) => void;
}) {
    return (
        <View style={{ flexDirection: "row", gap: 8, marginVertical: 8 }}>
            {[1, 2, 3, 4, 5].map((n) => (
                <Pressable
                    key={n}
                    onPress={() => onChange(n)}
                    style={{
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 6,
                        backgroundColor: n <= value ? "#FFD54F" : "#eee",
                    }}
                >
                    <Text style={{ fontSize: 18 }}>{n <= value ? "★" : "☆"}</Text>
                </Pressable>
            ))}
        </View>
    );
}

export default function PendingReviewsScreen() {
    const { token, user } = useAuth();
    const [loading, setLoading] = React.useState(false);
    const [data, setData] = React.useState<PendingRes | null>(null);
    const [active, setActive] = React.useState<TabKey>("buyer");

    // 写评弹窗
    const [writeVisible, setWriteVisible] = React.useState(false);
    const [writeOrderId, setWriteOrderId] = React.useState<string | null>(null);
    const [writeProductTitle, setWriteProductTitle] = React.useState<string>("");
    const [writeCounterpart, setWriteCounterpart] = React.useState<string>("");
    const [rating, setRating] = React.useState<number>(5);
    const [comment, setComment] = React.useState<string>("");
    const [isAnon, setIsAnon] = React.useState<boolean>(false);

    // 追评弹窗
    const [appendVisible, setAppendVisible] = React.useState(false);
    const [appendOrderId, setAppendOrderId] = React.useState<string | null>(null);
    const [appendReviewId, setAppendReviewId] = React.useState<string | null>(null);
    const [appendProductTitle, setAppendProductTitle] = React.useState<string>("");
    const [appendCounterpart, setAppendCounterpart] = React.useState<string>("");
    const [appendText, setAppendText] = React.useState<string>("");

    // 商品标题缓存
    const [titleCache, setTitleCache] = React.useState<Record<string, string>>({});
    const fetchTitle = React.useCallback(
        async (productId?: string | null): Promise<string> => {
            if (!productId) return "";
            const cached = titleCache[productId];
            if (cached) return cached;
            try {
                const p = await ProductService.getById(productId);
                const t = p?.title || "";
                if (t) setTitleCache((prev) => ({ ...prev, [productId]: t }));
                return t;
            } catch {
                return "";
            }
        },
        [titleCache]
    );

    // 可追评列表（只展示我已经写过首评的订单）
    const [appendables, setAppendables] = React.useState<AppendableItem[]>([]);

    const titleOf = (item: {
        product?: { id?: string | null; title?: string | null } | null;
        productId?: string | null;
    }) => {
        return item.product?.title || (item.productId && titleCache[item.productId]) || "商品";
    };

    const prefetchTitlesForPending = React.useCallback(async (res: PendingRes) => {
        const pids = new Set<string>();
        (res.buyer || []).forEach((i) =>
            i.product?.title ? null : i.productId ? pids.add(i.productId) : null
        );
        (res.seller || []).forEach((i) =>
            i.product?.title ? null : i.productId ? pids.add(i.productId) : null
        );
        await Promise.all(Array.from(pids).map((id) => fetchTitle(id)));
    }, [fetchTitle]);

    const loadAppendables = React.useCallback(async () => {
        try {
            const page = await ReviewsService.mineGiven(0, 100);
            const items: AppendableItem[] = [];
            for (const r of page.content || []) {
                // 先尽量从 review 中拿 productId / title
                let productId: string | null =
                    (r as any)?.product?.id || (r as any)?.productId || null;
                let title: string =
                    (r as any)?.product?.title || (r as any)?.productTitle || "";

                // 还没有 productId：按订单再查一次
                if (!productId) {
                    try {
                        const list = await ReviewsService.byOrder(r.orderId);
                        const mine = list.find((x) => x.reviewer?.id === user?.id) || list[0];
                        productId = (mine as any)?.product?.id || null;
                        title = title || (mine as any)?.product?.title || "";
                    } catch {
                        // ignore
                    }
                }

                // 还没有标题：用产品服务取一次并缓存
                if (!title && productId) {
                    title = await fetchTitle(productId);
                }

                items.push({
                    tab: "commented",
                    orderId: r.orderId,
                    productId: productId || "",
                    closedAt: (r as any).createdAt || null,
                    counterpart: {
                        id: r.reviewee?.id || "",
                        displayName: r.reviewee?.displayName || "-",
                        avatarUrl: r.reviewee?.avatarUrl || null,
                    },
                    product: { id: productId || "", title: title || "" },
                    // 仅前端使用
                    reviewId: r.id,
                } as AppendableItem);
            }
            setAppendables(items);
        } catch {
            setAppendables([]);
        }
    }, [fetchTitle, user?.id]);

    const load = React.useCallback(async () => {
        if (!token) {
            setData(null);
            setAppendables([]);
            return;
        }
        setLoading(true);
        try {
            const res = await ReviewsService.pending("all", 0, 50);
            setData(res);
            await prefetchTitlesForPending(res); // 预取买家/卖家标题
            await loadAppendables();              // 构建可追评并确保有 title
        } catch (e: any) {
            Alert.alert("加载失败", e?.message ?? "未知错误");
        } finally {
            setLoading(false);
        }
    }, [token, prefetchTitlesForPending, loadAppendables]);

    React.useEffect(() => {
        load();
    }, [load]);

    // —— 事件 —— //
    const openWrite = (item: PendingItem) => {
        setWriteOrderId(item.orderId);
        setWriteProductTitle(titleOf(item));
        setWriteCounterpart(item.counterpart?.displayName || "");
        setRating(5);
        setComment("");
        setIsAnon(false);
        setWriteVisible(true);
    };

    const doCreateReview = async () => {
        if (!writeOrderId) return;
        try {
            await ReviewsService.create({
                orderId: writeOrderId,
                rating,
                comment: comment?.trim() || "",
                isAnonymous: isAnon,
            });
            setWriteVisible(false);
            await load();
            Alert.alert("已提交评价", "感谢你的反馈！");
        } catch (e: any) {
            Alert.alert("提交失败", e?.message ?? "未知错误");
        }
    };

    const openAppend = (item: AppendableItem) => {
        const reviewId = (item as any).reviewId as string | undefined;
        if (!reviewId) {
            Alert.alert("未找到可追评的记录", "请稍后再试");
            return;
        }
        setAppendReviewId(reviewId);
        setAppendOrderId(item.orderId);
        setAppendProductTitle(titleOf(item));
        setAppendCounterpart(item.counterpart?.displayName || "");
        setAppendText("");
        setAppendVisible(true);
    };

    const doAppend = async () => {
        if (!appendReviewId) return;
        try {
            await ReviewsService.append(appendReviewId, { comment: appendText.trim() });
            setAppendVisible(false);
            await load();
            Alert.alert("已提交追评", "感谢你的补充反馈！");
        } catch (e: any) {
            Alert.alert("提交失败", e?.message ?? "未知错误");
        }
    };

    const TabButton = ({
                           k,
                           label,
                           count,
                       }: {
        k: TabKey;
        label: string;
        count?: number;
    }) => (
        <Pressable
            onPress={() => {
                setActive(k);
                if (k === "commented") loadAppendables();
            }}
            style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 10,
                backgroundColor: active === k ? "#222" : "#eee",
            }}
        >
            <Text style={{ color: active === k ? "#fff" : "#333", fontWeight: "600" }}>
                {label}
                {typeof count === "number" ? `(${count})` : ""}
            </Text>
        </Pressable>
    );

    const counts = {
        buyer: data?.counts?.buyer ?? 0,
        seller: data?.counts?.seller ?? 0,
        commented: appendables.length, // 以“确实可追评”的条目数为准
    };

    const buyerList = data?.buyer || [];
    const sellerList = data?.seller || [];

    return (
        <View style={{ flex: 1, padding: 12, gap: 12 }}>
            {/* 顶部标签 */}
            <View style={{ flexDirection: "row", gap: 10 }}>
                <TabButton k="buyer" label="作为买家" count={counts.buyer} />
                <TabButton k="seller" label="作为卖家" count={counts.seller} />
                <TabButton k="commented" label="可追评" count={counts.commented} />
            </View>

            {/* 列表 */}
            {active === "commented" ? (
                <>
                    <SectionHeader title="可追评" count={counts.commented} />
                    <FlatList
                        data={appendables}
                        keyExtractor={(i) => `${i.orderId}-${(i as any).reviewId || i.productId}`}
                        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
                        renderItem={({ item }) => (
                            <View
                                style={{
                                    padding: 12,
                                    backgroundColor: "#fff",
                                    borderRadius: 12,
                                    marginBottom: 10,
                                    gap: 4,
                                }}
                            >
                                <Text style={{ fontWeight: "700" }}>
                                    {item.product?.title || "商品"}
                                </Text>
                                <Text style={{ color: "#555" }}>
                                    交易对象：{item.counterpart?.displayName || "-"}
                                </Text>
                                <View
                                    style={{
                                        flexDirection: "row",
                                        justifyContent: "flex-end",
                                        gap: 8,
                                        marginTop: 6,
                                    }}
                                >
                                    <Pressable
                                        onPress={() => openAppend(item)}
                                        style={{
                                            paddingVertical: 6,
                                            paddingHorizontal: 12,
                                            backgroundColor: "#f5f5f5",
                                            borderRadius: 8,
                                        }}
                                    >
                                        <Text>去追评</Text>
                                    </Pressable>
                                </View>
                            </View>
                        )}
                    />
                </>
            ) : (
                <>
                    <SectionHeader
                        title={active === "buyer" ? "作为买家待评价" : "作为卖家待评价"}
                        count={active === "buyer" ? counts.buyer : counts.seller}
                    />
                    <FlatList
                        data={active === "buyer" ? buyerList : sellerList}
                        keyExtractor={(i) => `${i.orderId}-${i.productId}`}
                        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
                        renderItem={({ item }) => (
                            <View
                                style={{
                                    padding: 12,
                                    backgroundColor: "#fff",
                                    borderRadius: 12,
                                    marginBottom: 10,
                                    gap: 4,
                                }}
                            >
                                <Text style={{ fontWeight: "700" }}>
                                    {item.product?.title || (item.productId && titleCache[item.productId]) || "商品"}
                                </Text>
                                <Text style={{ color: "#555" }}>
                                    交易对象：{item.counterpart?.displayName || "-"}
                                </Text>
                                <View
                                    style={{
                                        flexDirection: "row",
                                        justifyContent: "flex-end",
                                        gap: 8,
                                        marginTop: 6,
                                    }}
                                >
                                    <Pressable
                                        onPress={() => openWrite(item)}
                                        style={{
                                            paddingVertical: 6,
                                            paddingHorizontal: 12,
                                            backgroundColor: "#222",
                                            borderRadius: 8,
                                        }}
                                    >
                                        <Text style={{ color: "#fff" }}>去评价</Text>
                                    </Pressable>
                                </View>
                            </View>
                        )}
                    />
                </>
            )}

            {/* 写评弹窗 */}
            <Modal visible={writeVisible} animationType="slide" transparent>
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.3)",
                        justifyContent: "flex-end",
                    }}
                >
                    <View
                        style={{
                            backgroundColor: "#fff",
                            padding: 16,
                            borderTopLeftRadius: 16,
                            borderTopRightRadius: 16,
                            gap: 8,
                        }}
                    >
                        <Text style={{ fontSize: 16, fontWeight: "700" }}>发表评价</Text>
                        <Text style={{ color: "#555" }}>{writeProductTitle}</Text>
                        <Text style={{ color: "#555" }}>对象：{writeCounterpart}</Text>

                        <RatingStars value={rating} onChange={setRating} />

                        <TextInput
                            value={comment}
                            onChangeText={setComment}
                            placeholder="写点使用体验吧（可选，最多4000字）"
                            multiline
                            style={{
                                minHeight: 100,
                                borderColor: "#ddd",
                                borderWidth: 1,
                                borderRadius: 10,
                                padding: 10,
                            }}
                        />

                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <Switch value={isAnon} onValueChange={setIsAnon} />
                            <Text>匿名评价</Text>
                        </View>

                        <View
                            style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 8 }}
                        >
                            <Pressable onPress={() => setWriteVisible(false)}>
                                <Text style={{ padding: 10 }}>取消</Text>
                            </Pressable>
                            <Pressable onPress={doCreateReview} style={{ backgroundColor: "#222", borderRadius: 8 }}>
                                <Text style={{ color: "#fff", paddingHorizontal: 14, paddingVertical: 10 }}>
                                    提交
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* 追评弹窗 */}
            <Modal visible={appendVisible} animationType="slide" transparent>
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.3)",
                        justifyContent: "flex-end",
                    }}
                >
                    <View
                        style={{
                            backgroundColor: "#fff",
                            padding: 16,
                            borderTopLeftRadius: 16,
                            borderTopRightRadius: 16,
                            gap: 8,
                        }}
                    >
                        <Text style={{ fontSize: 16, fontWeight: "700" }}>追加评价</Text>
                        <Text style={{ color: "#555" }}>{appendProductTitle}</Text>
                        <Text style={{ color: "#555" }}>对象：{appendCounterpart}</Text>

                        <TextInput
                            value={appendText}
                            onChangeText={setAppendText}
                            placeholder="补充更多体验（必填，最多4000字）"
                            multiline
                            style={{
                                minHeight: 100,
                                borderColor: "#ddd",
                                borderWidth: 1,
                                borderRadius: 10,
                                padding: 10,
                            }}
                        />

                        <View
                            style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 8 }}
                        >
                            <Pressable onPress={() => setAppendVisible(false)}>
                                <Text style={{ padding: 10 }}>取消</Text>
                            </Pressable>
                            <Pressable onPress={doAppend} style={{ backgroundColor: "#222", borderRadius: 8 }}>
                                <Text style={{ color: "#fff", paddingHorizontal: 14, paddingVertical: 10 }}>
                                    提交追评
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
