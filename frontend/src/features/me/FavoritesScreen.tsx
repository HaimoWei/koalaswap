// src/features/me/FavoritesScreen.tsx
import React from "react";
import { View, FlatList, Pressable, Text, Alert, RefreshControl } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { FavoriteService } from "../../services/favorites";
import ProductCard from "../home/ProductCard";

export default function FavoritesScreen() {
    const nav = useNavigation<any>();
    const { token } = useAuth();
    const [list, setList] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);

    const load = React.useCallback(async () => {
        if (!token) {
            setList([]);
            return;
        }
        setLoading(true);
        try {
            const data = await FavoriteService.listMine(token);
            setList(data || []);
        } catch (e: any) {
            Alert.alert("错误", e?.message || "加载收藏失败");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useFocusEffect(
        React.useCallback(() => {
            load();
        }, [load])
    );

    const handleUnfav = async (id: string) => {
        if (!token) return;
        try {
            const r = await FavoriteService.toggle(token, id);
            if (!r.fav) setList((prev) => prev.filter((p) => p.id !== id));
        } catch (e: any) {
            Alert.alert("错误", e?.message || "取消收藏失败");
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={{ marginBottom: 12, backgroundColor: "#fff", borderRadius: 12, overflow: "hidden" }}>
            <ProductCard
                item={item}
                onPress={() => {
                    if (item.status !== "ACTIVE") {
                        const label = item.status === "SOLD" ? "已售出" : "已下架";
                        Alert.alert("提示", `该商品${label}`);
                        return;
                    }
                    nav.navigate("ProductDetail", { id: item.id });
                }}
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 12, paddingBottom: 10 }}>
                <Pressable onPress={() => handleUnfav(item.id)}>
                    <Text style={{ color: "#d11" }}>取消收藏</Text>
                </Pressable>
            </View>
        </View>
    );

    return (
        <View style={{ flex: 1, padding: 12 }}>
            <FlatList
                data={list}
                keyExtractor={(i) => i.id}
                renderItem={renderItem}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
                ListEmptyComponent={
                    <View style={{ alignItems: "center", marginTop: 40 }}>
                        <Text style={{ color: "#888" }}>还没有收藏的宝贝</Text>
                    </View>
                }
            />
        </View>
    );
}
