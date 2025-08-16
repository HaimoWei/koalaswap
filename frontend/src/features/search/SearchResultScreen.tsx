// src/features/search/SearchResultScreen.tsx —— “结果页”
import React from "react";
import { View, Text, TextInput, FlatList, Pressable } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { ProductService } from "../../services/products";
import { UsersService, UserBrief } from "../../services/users";
import ProductCard from "../home/ProductCard";

type Sort = "relevance" | "price_asc" | "price_desc" | "newest";

export default function SearchResultScreen() {
    const nav = useNavigation<any>();
    const route = useRoute<any>();
    const { user } = useAuth();
    const qParam = route.params?.q ?? "";

    const [kw, setKw] = React.useState<string>(qParam);
    const [sort, setSort] = React.useState<Sort>("relevance");
    const [loading, setLoading] = React.useState(false);
    const [items, setItems] = React.useState<any[]>([]);
    const [sellerMap, setSellerMap] = React.useState<Record<string, UserBrief>>({});

    const sortToApi = (s: Sort) =>
        s === "price_asc" ? "price,asc" : s === "price_desc" ? "price,desc" : s === "newest" ? "createdAt,desc" : undefined;

    const search = React.useCallback(async (keyword: string) => {
        setLoading(true);
        try {
            const page = await ProductService.list({
                page: 0,
                size: 50,
                keyword,
                sort: sortToApi(sort),
                excludeSellerId: user?.id, // ← 过滤掉自己发布的
            });
            setItems(page.content);

            const ids = Array.from(new Set(page.content.map((x) => x.sellerId).filter(Boolean)));
            const m = await UsersService.getBriefs(ids);
            setSellerMap(m);
        } finally {
            setLoading(false);
        }
    }, [sort, user?.id]);

    React.useEffect(() => { search(qParam); }, [qParam, search]);

    return (
        <View style={{ flex: 1, padding: 12 }}>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                <TextInput value={kw} onChangeText={setKw}
                           placeholder="关键字" style={{ flex: 1, borderWidth: 1, borderColor: "#ddd", paddingHorizontal: 10, borderRadius: 8 }} />
                <Pressable onPress={() => search(kw)}><Text style={{ padding: 10, color: "#06c" }}>搜索</Text></Pressable>
            </View>

            <View style={{ flexDirection: "row", gap: 10, marginBottom: 8 }}>
                {(["relevance","price_asc","price_desc","newest"] as Sort[]).map((s) => (
                    <Pressable key={s} onPress={() => setSort(s)} style={{ paddingHorizontal: 10, paddingVertical: 6, backgroundColor: s===sort?"#222":"#eee", borderRadius: 14 }}>
                        <Text style={{ color: s===sort?"#fff":"#333" }}>
                            {s==="relevance"?"相关度":s==="price_asc"?"价格↑":s==="price_desc"?"价格↓":"最新"}
                        </Text>
                    </Pressable>
                ))}
            </View>

            <FlatList
                data={items}
                keyExtractor={(it) => it.id}
                renderItem={({ item }) => (
                    <ProductCard
                        item={item}
                        seller={sellerMap[item.sellerId]}
                        onPress={() => nav.navigate("ProductDetail", { id: item.id })}
                    />
                )}
                refreshing={loading}
                onRefresh={() => search(kw)}
                ListEmptyComponent={<Text style={{ textAlign:"center", color:"#888", marginTop:40 }}>没有搜索结果</Text>}
            />
        </View>
    );
}
