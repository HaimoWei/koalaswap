import React from "react";
import { View, Text, FlatList, RefreshControl, Pressable } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { UsersService, UserBrief } from "../../services/users";
import HomeService from "../../services/home";
import ProductCard from "../home/ProductCard";

export default function ProductListScreen() {
    const nav = useNavigation<any>();
    const [page, setPage] = React.useState(0);
    const [size] = React.useState(10);
    const [items, setItems] = React.useState<any[]>([]);
    const [totalPages, setTotalPages] = React.useState(1);
    const [loading, setLoading] = React.useState(false);
    const [sellerMap, setSellerMap] = React.useState<Record<string, UserBrief>>({});

    const load = React.useCallback(async (p = 0) => {
        setLoading(true);
        try {
            const res = await HomeService.list({ page: p, size, sort: "createdAt,desc" });
            setItems(res.content);
            setTotalPages(res.totalPages);
            setPage(p);

            const ids = Array.from(new Set(res.content.map((x: any) => x.sellerId).filter(Boolean)));
            if (ids.length) {
                const m = await UsersService.getBriefs(ids);
                setSellerMap(m);
            } else {
                setSellerMap({});
            }
        } finally {
            setLoading(false);
        }
    }, [size]);

    useFocusEffect(React.useCallback(() => { load(0); }, [load]));

    const SearchBarLink = () => (
        <Pressable
            onPress={() => nav.navigate("Search")}
            style={{
                margin: 12,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 8,
                backgroundColor: "#f7f7f7",
            }}
        >
            <Text style={{ color: "#888" }}>搜索商品</Text>
        </Pressable>
    );

    return (
        <View style={{ flex: 1, paddingTop: 4 }}>
            <SearchBarLink />
            <FlatList
                data={items}
                keyExtractor={(it: any) => it.id}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={() => load(page)} />}
                renderItem={({ item }) => (
                    <ProductCard
                        item={item}
                        seller={sellerMap[item.sellerId]}
                        onPress={() => nav.navigate("ProductDetail", { id: item.id })}
                    />
                )}
                ListEmptyComponent={<Text style={{ textAlign: "center", color: "#888", marginTop: 40 }}>暂无商品</Text>}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", margin: 12 }}>
                <Pressable onPress={() => load(Math.max(0, page - 1))} disabled={page <= 0 || loading}>
                    <Text style={{ padding: 10, color: page <= 0 || loading ? "#bbb" : "#06c" }}>上一页</Text>
                </Pressable>
                <Text>第 {page + 1}/{totalPages} 页</Text>
                <Pressable onPress={() => load(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1 || loading}>
                    <Text style={{ padding: 10, color: page >= totalPages - 1 || loading ? "#bbb" : "#06c" }}>下一页</Text>
                </Pressable>
            </View>
        </View>
    );
}
