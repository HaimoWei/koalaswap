// src/features/products/ProductListScreen.tsx
import React from "react";
import { View, Text, FlatList, RefreshControl, TextInput, Button } from "react-native";
import { ProductService } from "../../services/products";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import ProductCard from "../home/ProductCard";

export default function ProductListScreen() {
    const nav = useNavigation<any>();
    const { user } = useAuth();

    const [page, setPage] = React.useState(0);
    const [size] = React.useState(10);
    const [keyword, setKeyword] = React.useState("");
    const [list, setList] = React.useState<any[]>([]);
    const [totalPages, setTotalPages] = React.useState(1);
    const [loading, setLoading] = React.useState(false);

    const load = async (p = page, kw = keyword) => {
        setLoading(true);
        const res = await ProductService.list({ page: p, size, keyword: kw || undefined, excludeSellerId: user?.id || undefined });
        setList(res.content);
        setTotalPages(res.totalPages);
        setPage(res.page);
        setLoading(false);
    };

    React.useEffect(() => { load(0, ""); }, [user?.id]);

    return (
        <View style={{ flex:1, padding:12 }}>
            <View style={{ flexDirection:"row", gap:8, marginBottom:8 }}>
                <TextInput
                    placeholder="搜索你想要的宝贝"
                    value={keyword}
                    onFocus={() => nav.getParent()?.navigate("Search", { q: keyword })}
                    onChangeText={setKeyword}
                    style={{ borderWidth:1, borderRadius:20, paddingHorizontal:14, paddingVertical:8, flex:1 }}
                />
                <Button title="搜索" onPress={() => nav.getParent()?.navigate("Search", { q: keyword })} />
            </View>

            <FlatList
                data={list}
                keyExtractor={(item) => item.id}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={() => load(page, keyword)} />}
                renderItem={({ item }) => (
                    <ProductCard item={item} onPress={() => nav.getParent()?.navigate("ProductDetail", { id: item.id })} />
                )}
            />

            <View style={{ flexDirection:"row", justifyContent:"space-between", marginTop:8 }}>
                <Button title="上一页" onPress={() => load(Math.max(0, page-1), keyword)} disabled={page<=0 || loading} />
                <Text>第 {page+1}/{totalPages} 页</Text>
                <Button title="下一页" onPress={() => load(Math.min(totalPages-1, page+1), keyword)} disabled={page>=totalPages-1 || loading} />
            </View>
        </View>
    );
}
