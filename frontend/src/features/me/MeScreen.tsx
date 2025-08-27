// src/features/me/MeScreen.tsx
// 作用：个人中心，统计入口 + 退出登录（最小改动：修复“待评价”为买家+卖家之和）
import React from "react";
import { View, Text, Button, Pressable } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { ProductService } from "../../services/products";
import ReviewsService from "../../services/reviews";
import { orderApi } from "../../lib/api";
import { unwrap } from "../../lib/unwrap";
import { FavoriteService } from "../../services/favorites";

type Counts = {
    mine: number;            // 我发布的
    fav: number;             // 收藏（暂未接后端）
    sold: number;            // 我卖出的
    orders: number;          // 我的订单（买家）
    pendingReviews: number;  // 待评价（买家+卖家）
};

async function countOrders(role: "buyer" | "seller"): Promise<number> {
    try {
        const res = await orderApi.get("/api/orders", { params: { role, page: 0, size: 1 } });
        const page: any = unwrap(res.data);
        if (typeof page?.totalElements === "number") return page.totalElements;
        if (Array.isArray(page?.content)) return page.content.length;
        if (Array.isArray(page)) return page.length;
        return 0;
    } catch {
        return 0;
    }
}

export default function MeScreen() {
    const { token, user, logout } = useAuth();
    const nav = useNavigation<any>();
    const [counts, setCounts] = React.useState<Counts>({
        mine: 0,
        fav: 0,
        sold: 0,
        orders: 0,
        pendingReviews: 0,
    });

    const load = React.useCallback(async () => {
        if (!token) {
            setCounts({ mine: 0, fav: 0, sold: 0, orders: 0, pendingReviews: 0 });
            return;
        }
        try {
            // 我发布的
            const page: any = await ProductService.listMine("onsale", 0, 1, "createdAt,desc");
            const totalMine =
                (page && typeof page.totalElements === "number" && page.totalElements) ??
                (Array.isArray(page?.content) ? page.content.length : 0) ??
                0;

            // 我的订单 / 我卖出的
            const [buyerCount, sellerCount] = await Promise.all([
                countOrders("buyer"),
                countOrders("seller"),
            ]);

            // 待评价 = 作为买家可评 + 作为卖家可评（分别拉两次，避免 tab=all 差异）
            let pendingReviews = 0;
            try {
                const [buyerPending, sellerPending] = await Promise.all([
                    ReviewsService.countPending("buyer"),
                    ReviewsService.countPending("seller"),
                ]);
                pendingReviews = buyerPending + sellerPending;
            } catch {
                pendingReviews = 0;
            }

            let fav = 0;
            try { fav = await FavoriteService.countMine(token); } catch {}

            setCounts({
                mine: totalMine,
                fav: fav,
                sold: sellerCount,
                orders: buyerCount,
                pendingReviews,
            });
        } catch {
            setCounts({ mine: 0, fav: 0, sold: 0, orders: 0, pendingReviews: 0 });
        }
    }, [token]);

    useFocusEffect(React.useCallback(() => { load(); }, [load]));

    if (!token) {
        return (
            <View style={{ flex: 1, padding: 16, gap: 12 }}>
                <Text style={{ fontSize: 20, fontWeight: "700" }}>我的</Text>
                <Button title="去登录" onPress={() => nav.navigate("Login")} />
                <Button title="去注册" onPress={() => nav.navigate("Register")} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, padding: 16, gap: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: "700" }}>我的</Text>

            {/* 顶部个人信息 */}
            <Pressable
                onPress={() => nav.navigate("Settings")}
                style={{
                    backgroundColor: "#fff",
                    borderRadius: 16,
                    padding: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                }}
            >
                <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: "#eee" }} />
                <View>
                    <Text style={{ fontSize: 18, fontWeight: "700" }}>
                        {user?.displayName || (user as any)?.email}
                    </Text>
                    <Text style={{ color: "#555" }}>点击编辑个人资料</Text>
                </View>
            </Pressable>

            {/* 功能入口 */}
            <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 12, gap: 12 }}>
                <Pressable onPress={() => nav.navigate("MyListings")}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text>我发布的</Text>
                        <Text>{counts.mine}</Text>
                    </View>
                </Pressable>

                <Pressable onPress={() => nav.navigate("Sold")}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text>我卖出的</Text>
                        <Text>{counts.sold}</Text>
                    </View>
                </Pressable>

                <Pressable onPress={() => nav.navigate("MyOrders")}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text>我的订单</Text>
                        <Text>{counts.orders}</Text>
                    </View>
                </Pressable>

                <Pressable onPress={() => nav.navigate("PendingReviews")}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text>待评价</Text>
                        <Text>{counts.pendingReviews}</Text>
                    </View>
                </Pressable>

                {/* 收藏入口（后端未接） */}
                <Pressable onPress={() => nav.navigate("Favorites")}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text>我的收藏</Text>
                        <Text>{counts.fav}</Text>
                    </View>
                </Pressable>
            </View>

            <Button
                title="退出登录"
                onPress={async () => {
                    await logout();
                    nav.navigate("Login");
                }}
            />
        </View>
    );
}
