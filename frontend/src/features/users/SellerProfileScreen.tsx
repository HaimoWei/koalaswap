// src/features/users/SellerProfileScreen.tsx
import React from "react";
import { View, Text, Image, FlatList, RefreshControl, Pressable, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import ProductCard from "../home/ProductCard";
import UsersService, { UserBrief } from "../../services/users";
import { productApi, reviewApi } from "../../lib/api";
import { unwrap } from "../../lib/unwrap";
import type { ApiResponse, Page as SpringPage } from "../../lib/types";

type Params = { id: string };

// 统一分页为前端易用结构
type UiPage<T> = { content: T[]; page: number; size: number; totalElements: number; totalPages: number };
function toUiPage<T>(pg: SpringPage<T>): UiPage<T> {
    const page = (pg as any).number ?? 0;
    const size = (pg as any).size ?? (Array.isArray(pg?.content) ? pg.content.length : 0);
    const totalElements = (pg as any).totalElements ?? (Array.isArray(pg?.content) ? pg.content.length : 0);
    const totalPages = (pg as any).totalPages ?? 1;
    return { content: (pg as any).content ?? [], page, size, totalElements, totalPages };
}

// 评价条目（前端渲染用，尽量宽松以适配后端不同命名）
type ReviewItem = {
    id: string | number;
    rating: number;
    comment?: string | null;
    anonymous?: boolean;
    createdAt?: string;
    reviewer?: { id?: string | number; displayName?: string | null; avatarUrl?: string | null } | null;
    // 可能存在的嵌套追评
    appends?: ReviewItem[];
    children?: ReviewItem[];
    appendList?: ReviewItem[];
    // 平铺追评可能用到的字段
    parentId?: string | number | null;
    rootId?: string | number | null;
    appendToId?: string | number | null;
    parentReviewId?: string | number | null;
    targetReviewId?: string | number | null;
    isAppend?: boolean;
    type?: string;
};

export default function SellerProfileScreen() {
    const nav = useNavigation<any>();
    const route = useRoute<any>();
    const { id } = (route.params || {}) as Params;

    const [seller, setSeller] = React.useState<UserBrief | null>(null);

    // tabs
    const [tab, setTab] = React.useState<"products" | "reviews">("products");

    // products
    const [items, setItems] = React.useState<any[]>([]);
    const [page, setPage] = React.useState(0);
    const [totalPages, setTotalPages] = React.useState(1);
    const [loading, setLoading] = React.useState(false);

    // reviews
    const [reviewsFlat, setReviewsFlat] = React.useState<ReviewItem[]>([]);
    const [rvPage, setRvPage] = React.useState(0);
    const [rvTotalPages, setRvTotalPages] = React.useState(1);
    const [rvLoading, setRvLoading] = React.useState(false);

    // 读取卖家信息
    const loadSeller = React.useCallback(async () => {
        if (!id) return;
        try {
            const brief = await UsersService.getBrief(String(id));
            setSeller(brief);
        } catch {
            setSeller(null);
        }
    }, [id]);

    // 读取在售商品：优先 /api/products/users/{id}，其次 /api/products?sellerId=...
    const loadProducts = React.useCallback(async (p: number = 0) => {
        if (!id) return;
        setLoading(true);
        try {
            // 1) /users/{id}
            try {
                const { data } = await productApi.get<ApiResponse<SpringPage<any>>>(`/api/products/users/${id}`, {
                    params: { page: p, size: 12, sort: "createdAt,desc" },
                });
                const pg = unwrap<SpringPage<any>>(data);
                const uip = toUiPage<any>(pg);
                setItems(uip.content || []);
                setPage(uip.page);
                setTotalPages(uip.totalPages);
                return;
            } catch {}

            // 2) ?sellerId=
            try {
                const { data } = await productApi.get<ApiResponse<SpringPage<any>>>("/api/products", {
                    params: { page: p, size: 12, sort: "createdAt,desc", sellerId: id },
                });
                const pg = unwrap<SpringPage<any>>(data);
                const uip = toUiPage<any>(pg);
                setItems(uip.content || []);
                setPage(uip.page);
                setTotalPages(uip.totalPages);
                return;
            } catch {}

            // 3) 兜底（只保证页面可打开，不影响其它页）
            const { data } = await productApi.get<ApiResponse<SpringPage<any>>>("/api/products/home", {
                params: { page: p, size: 50, sort: "createdAt,desc" },
            });
            const pg = unwrap<SpringPage<any>>(data);
            const uip = toUiPage<any>(pg);
            const filtered = (uip.content || []).filter((x: any) => String(x.sellerId) === String(id));
            setItems(filtered);
            setPage(0);
            setTotalPages(1);
        } catch (e: any) {
            Alert.alert("提示", e?.message || String(e));
        } finally {
            setLoading(false);
        }
    }, [id]);

    // 读取评价：/api/reviews/users/{id}
    const loadReviews = React.useCallback(async (p: number = 0) => {
        if (!id) return;
        setRvLoading(true);
        try {
            const { data } = await reviewApi.get<ApiResponse<SpringPage<ReviewItem>>>(`/api/reviews/users/${id}`, {
                params: { page: p, size: 10, role: "all", withAppends: true }, // [CHANGED] 带上 withAppends，后端才会返回追评
            });
            const pg = unwrap<SpringPage<ReviewItem>>(data);
            const uip = toUiPage<ReviewItem>(pg);
            setReviewsFlat(uip.content || []);
            setRvPage(uip.page);
            setRvTotalPages(uip.totalPages);
        } catch {
            setReviewsFlat([]);
            setRvPage(0);
            setRvTotalPages(1);
        } finally {
            setRvLoading(false);
        }
    }, [id]);

    // 把追评挂到主评后面（兼容多种字段）
    const groupedReviews = React.useMemo(() => {
        const list = reviewsFlat || [];

        // 如果后端已经提供了嵌套（appends/children/appendList），直接返回处理后的结果
        // [CHANGED] 条件从“全部都有”改为“任意一项有”，并把 null 当成 []
        const hasNested = list.some((r: any) =>
            Array.isArray((r as any).appends) || Array.isArray((r as any).children) || Array.isArray((r as any).appendList)
        ); // [CHANGED]
        if (hasNested) { // [CHANGED]
            return list.map((r: any) => {
                const app = (r.appends || r.children || r.appendList || []) as ReviewItem[];
                const appSorted = [...app].sort((a, b) => (new Date(a.createdAt || 0).getTime()) - (new Date(b.createdAt || 0).getTime()));
                return { root: r, appends: appSorted };
            });
        }

        // 平铺场景：分组
        const roots: ReviewItem[] = [];
        const childMap: Record<string, ReviewItem[]> = {};

        const getPid = (x: any) =>
            x.parentId ?? x.rootId ?? x.appendToId ?? x.parentReviewId ?? x.targetReviewId ?? null;
        const isAppend = (x: any) => !!getPid(x) || x.isAppend === true || x.type === "APPEND";

        for (const r of list) {
            if (isAppend(r)) {
                const pid = String(getPid(r));
                if (!childMap[pid]) childMap[pid] = [];
                childMap[pid].push(r);
            } else {
                roots.push(r);
            }
        }

        roots.sort((a, b) => (new Date(a.createdAt || 0).getTime()) - (new Date(b.createdAt || 0).getTime()));

        return roots.map((root) => {
            const children = childMap[String(root.id)] || [];
            const appSorted = [...children].sort((a, b) => (new Date(a.createdAt || 0).getTime()) - (new Date(b.createdAt || 0).getTime()));
            return { root, appends: appSorted };
        });
    }, [reviewsFlat]);

    React.useEffect(() => { loadSeller(); }, [loadSeller]);
    React.useEffect(() => {
        if (tab === "products") loadProducts(0);
        if (tab === "reviews") loadReviews(0);
    }, [tab, loadProducts, loadReviews]);

    // 兼容 ProductCard 类型（把 null 变 undefined，避免你去改 ProductCard.tsx）
    const sellerLite = seller ? { displayName: seller.displayName, avatarUrl: seller.avatarUrl ?? undefined } : undefined;

    const renderHeader = () => (
        <View style={{ padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderColor: "#eee" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                {seller?.avatarUrl ? (
                    <Image source={{ uri: seller.avatarUrl }} style={{ width: 56, height: 56, borderRadius: 28 }} />
                ) : (
                    <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "#f0f0f0", alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontSize: 18, color: "#666" }}>{seller?.displayName?.slice(0, 1) ?? "?"}</Text>
                    </View>
                )}
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: "700" }}>{seller?.displayName ?? "卖家"}</Text>
                    <Text style={{ color: "#666" }}>ID: {String(id)}</Text>
                </View>
            </View>

            {/* tabs */}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
                <Pressable onPress={() => setTab("products")}>
                    <Text style={{ fontSize: 16, fontWeight: tab === "products" ? ("700" as const) : ("400" as const) }}>在售商品</Text>
                </Pressable>
                <Pressable onPress={() => setTab("reviews")}>
                    <Text style={{ fontSize: 16, fontWeight: tab === "reviews" ? ("700" as const) : ("400" as const) }}>评价</Text>
                </Pressable>
            </View>
        </View>
    );

    if (!id) {
        return <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><Text>链接缺少卖家ID</Text></View>;
    }

    if (!seller) {
        return <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><Text>加载中...</Text></View>;
    }

    if (tab === "products") {
        return (
            <View style={{ flex: 1 }}>
                {renderHeader()}
                <FlatList
                    data={items}
                    keyExtractor={(it) => String(it.id)}
                    renderItem={({ item }) => (
                        <ProductCard
                            item={item}
                            onPress={() => nav.navigate("ProductDetail", { id: item.id })}
                            seller={sellerLite as any}
                        />
                    )}
                    contentContainerStyle={{ padding: 12, gap: 12 }}
                    refreshControl={<RefreshControl refreshing={loading} onRefresh={() => loadProducts(page)} />}
                    ListEmptyComponent={<Text style={{ textAlign: "center", color: "#888", marginTop: 40 }}>暂无商品</Text>}
                />
                <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 12 }}>
                    <Pressable onPress={() => loadProducts(Math.max(0, page - 1))} disabled={page <= 0 || loading}>
                        <Text style={{ padding: 10, color: page <= 0 || loading ? "#bbb" : "#06c" }}>上一页</Text>
                    </Pressable>
                    <Text>第 {page + 1}/{totalPages} 页</Text>
                    <Pressable onPress={() => loadProducts(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1 || loading}>
                        <Text style={{ padding: 10, color: page >= totalPages - 1 || loading ? "#bbb" : "#06c" }}>下一页</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    // reviews tab（追评挂在主评后）
    return (
        <View style={{ flex: 1 }}>
            {renderHeader()}
            <FlatList
                data={groupedReviews}
                keyExtractor={(it) => String(it.root.id)}
                renderItem={({ item }) => (
                    <View style={{ marginHorizontal: 12, marginTop: 8 }}>
                        <View style={{ backgroundColor: "#fff", padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#eee" }}>
                            <Text style={{ fontWeight: "600" }}>评分：{item.root.rating}</Text>
                            {!!item.root.comment && <Text style={{ marginTop: 4 }}>{item.root.comment}</Text>}
                            <Text style={{ color: "#888", marginTop: 6, fontSize: 12 }}>
                                来自：{item.root.reviewer?.displayName ?? (item.root.anonymous ? "匿名" : "用户")}
                            </Text>
                        </View>
                        {item.appends.map((ap) => (
                            <View
                                key={String(ap.id)}
                                style={{ marginTop: 6, marginLeft: 12, backgroundColor: "#fff", padding: 10, borderRadius: 8, borderWidth: 1, borderColor: "#eee", borderLeftWidth: 3, borderLeftColor: "#ddd" }}
                            >
                                <Text style={{ fontSize: 12, color: "#666" }}>追评</Text>
                                {!!ap.comment && <Text style={{ marginTop: 4 }}>{ap.comment}</Text>}
                                <Text style={{ color: "#888", marginTop: 6, fontSize: 12 }}>
                                    来自：{ap.reviewer?.displayName ?? (ap.anonymous ? "匿名" : "用户")}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}
                refreshControl={<RefreshControl refreshing={rvLoading} onRefresh={() => loadReviews(rvPage)} />}
                ListEmptyComponent={<Text style={{ textAlign: "center", color: "#888", marginTop: 40 }}>暂无评价</Text>}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 12 }}>
                <Pressable onPress={() => loadReviews(Math.max(0, rvPage - 1))} disabled={rvPage <= 0 || rvLoading}>
                    <Text style={{ padding: 10, color: rvPage <= 0 || rvLoading ? "#bbb" : "#06c" }}>上一页</Text>
                </Pressable>
                <Text>第 {rvPage + 1}/{rvTotalPages} 页</Text>
                <Pressable onPress={() => loadReviews(Math.min(rvTotalPages - 1, rvPage + 1))} disabled={rvPage >= rvTotalPages - 1 || rvLoading}>
                    <Text style={{ padding: 10, color: rvPage >= rvTotalPages - 1 || rvLoading ? "#bbb" : "#06c" }}>下一页</Text>
                </Pressable>
            </View>
        </View>
    );
}
