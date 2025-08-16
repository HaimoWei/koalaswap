// src/features/me/MyListingsScreen.tsx
import React from "react";
import { View, Text, FlatList, RefreshControl, Button } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { ProductService } from "../../services/products";
import ProductCard from "../home/ProductCard";

export default function MyListingsScreen() {
    const { token } = useAuth();
    const nav = useNavigation<any>();
    const [page, setPage] = React.useState(0);
    const [size] = React.useState(10);
    const [items, setItems] = React.useState<any[]>([]);
    const [totalPages, setTotalPages] = React.useState(1);
    const [loading, setLoading] = React.useState(false);

    const load = React.useCallback(async (p = 0) => {
        if (!token) { setItems([]); setTotalPages(1); setPage(0); return; }
        setLoading(true);
        try {
            const res: any = await ProductService.listMine(p, size, "createdAt,desc");
            const list = Array.isArray(res?.content) ? res.content : (Array.isArray(res) ? res : []);
            const tp = typeof res?.totalPages === "number" ? res.totalPages : 1;
            setItems(list);
            setTotalPages(tp);
            setPage(p);
        } finally {
            setLoading(false);
        }
    }, [size, token]);

    // 回到“我的发布”时自动刷新（例如从详情删除后返回）
    useFocusEffect(React.useCallback(() => { load(page); }, [load, page]));

    if (!token) {
        return (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
                <Text style={{ color: "#888" }}>请先登录后查看“我的发布”</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, padding: 12 }}>
            <FlatList
                data={items}
                keyExtractor={(it) => it.id}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={() => load(page)} />}
                renderItem={({ item }) => (
                    <ProductCard item={item} onPress={() => nav.navigate("ProductPreview", { id: item.id })} />
                )}
                ListEmptyComponent={<Text style={{ textAlign: "center", color: "#888", marginTop: 40 }}>暂无发布</Text>}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
                <Button title="上一页" onPress={() => load(Math.max(0, page - 1))} disabled={page <= 0 || loading} />
                <Text>第 {page + 1}/{totalPages} 页</Text>
                <Button title="下一页" onPress={() => load(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1 || loading} />
            </View>
        </View>
    );
}
