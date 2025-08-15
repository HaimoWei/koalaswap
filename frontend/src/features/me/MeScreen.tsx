// src/features/me/MeScreen.tsx
// 作用：演示“退出登录”流程（清除 token）。
// 点击按钮 → AuthContext.signOut() → 清 SecureStore + 清内存 → RootNavigator 回到登录。
// src/features/me/MeScreen.tsx
// 作用：个人中心，统计入口 + 退出登录
import React from "react";
import { View, Text, Button, Pressable } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { ProductService } from "../../services/products";
import { FavoriteService } from "../../services/favorites";
import { OrderService } from "../../services/orders";

export default function MeScreen() {
    const { token, user, logout } = useAuth();
    const nav = useNavigation<any>();
    const [counts, setCounts] = React.useState({ mine: 0, fav: 0, sold: 0, orders: 0 });

    const load = React.useCallback(async () => {
        if (!token) return setCounts({ mine: 0, fav: 0, sold: 0, orders: 0 });
        const [mine, fav, sold, orders] = await Promise.all([
            ProductService.listMine(token),
            FavoriteService.listMine(token),
            OrderService.sold(token),
            OrderService.myOrders(token),
        ]);
        setCounts({ mine: mine.length, fav: fav.length, sold: sold.length, orders: orders.length });
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
        <View style={{ flex: 1, padding: 16, gap: 16 }}>
            <Pressable onPress={() => nav.navigate("Settings")} style={{ backgroundColor: "#ffef8a", borderRadius: 16, padding: 14 }}><View>
                <Text style={{ fontSize: 18, fontWeight: "700" }}>{user?.displayName || user?.email}</Text>
                <Text style={{ color: "#555" }}>点击编辑个人资料</Text>
            </View></Pressable>

            <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 12, gap: 12 }}>
                <Pressable onPress={() => nav.navigate("MyListings")} style={{}}><View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text>我发布的</Text>
                    <Text>{counts.mine}</Text>
                </View></Pressable>

                <Pressable onPress={() => nav.navigate("Sold")} style={{}}><View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text>我卖出的</Text>
                    <Text>{counts.sold}</Text>
                </View></Pressable>

                <Pressable onPress={() => nav.navigate("MyOrders")} style={{}}><View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text>我的订单</Text>
                    <Text>{counts.orders}</Text>
                </View></Pressable>

                <Pressable onPress={() => nav.navigate("Favorites")} style={{}}><View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text>我的收藏</Text>
                    <Text>{counts.fav}</Text>
                </View></Pressable>

                <Pressable onPress={() => nav.navigate("PendingReviews")} style={{}}><View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text>待评价</Text>
                    <Text>0</Text>
                </View></Pressable>

                <Pressable onPress={() => nav.navigate("Settings")} style={{}}><View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text>设置</Text>
                    <Text>›</Text>
                </View></Pressable>
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
