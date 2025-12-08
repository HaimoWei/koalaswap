// src/features/me/FavoritesScreen.tsx
import React from "react";
import { View, FlatList, Pressable, Text, Alert, RefreshControl } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { FavoriteService } from "../../services/favorites";
import { ProductService } from "../../services/products";
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
            const raw = await FavoriteService.listMine(token, 0, 100);
            // 补齐必要字段（images/status）以便 ProductCard 完整展示
            const filled = await Promise.all(
                raw.map(async (p: any) => {
                    if (Array.isArray(p?.images) && p.images.length > 0 && p?.status) return p;
                    try {
                        const full = await ProductService.getById(p.id);
                        return { ...p, ...full };
                    } catch {
                        return p;
                    }
                })
            );
            setList(filled);
        } catch (e: any) {
            Alert.alert("加载失败", e?.message ?? "未知错误");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useFocusEffect(React.useCallback(() => { load(); }, [load]));

    const goDetail = (id: string) => nav.navigate("ProductDetail", { id });

    const removeFav = async (id: string) => {
        if (!token) return;
        try {
            await FavoriteService.remove(token, id);
            setList((prev) => prev.filter((x) => x.id !== id));
        } catch (e: any) {
            Alert.alert("删除失败", e?.message ?? "未知错误");
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const invalid = String(item?.status || "") !== "ACTIVE";
        return (
            <View style={{ marginBottom: 12 }}>
                {/* 点击拦截：失效的不允许跳详情 */}
                <ProductCard
                    item={item}
                    onPress={() =>
                        (String(item?.status || "") !== "ACTIVE"
                            ? Alert.alert("温馨提示", "该商品已失效或已下架，无法查看详情。")
                            : goDetail(item.id))
                    }
                />
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 8, marginTop: 6 }}>
                    <Text style={{ color: invalid ? "#d00" : "#888" }}>
                        {invalid ? "已失效" : " "}
                    </Text>
                    <Pressable
                        onPress={() => removeFav(item.id)}
                        style={{ paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#f2f2f2", borderRadius: 8 }}
                    >
                        <Text>删除</Text>
                    </Pressable>
                </View>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, padding: 12 }}>
            <FlatList
                data={list}
                keyExtractor={(i) => String(i.id)}
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
