// src/features/search/SearchResultScreen.tsx  —— “结果页”
import React from "react";
import { View, Text, TextInput, FlatList, Pressable } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ProductService } from "../../services/products";
import { useAuth } from "../../context/AuthContext";
import ProductCard from "../home/ProductCard";

type Sort = "relevance" | "price_asc" | "price_desc" | "newest";

export default function SearchResultScreen() {
    const nav = useNavigation<any>();
    const route = useRoute<any>();
    const { user } = useAuth();
    const qParam = route.params?.q ?? "";

    const [q, setQ] = React.useState(qParam);
    const [raw, setRaw] = React.useState<any[]>([]);
    const [list, setList] = React.useState<any[]>([]);
    const [sort, setSort] = React.useState<Sort>("relevance");

    const applySort = (arr: any[], s: Sort) => {
        const cp = [...arr];
        if (s === "price_asc") cp.sort((a,b)=>a.price-b.price);
        if (s === "price_desc") cp.sort((a,b)=>b.price-a.price);
        if (s === "newest") cp.sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return cp;
    };

    const search = async (kw: string) => {
        const res = await ProductService.list({ page:0, size:50, keyword: kw, excludeSellerId: user?.id || undefined });
        setRaw(res.content);
        setList(applySort(res.content, sort));
    };

    React.useEffect(()=> { search(qParam); }, [qParam]);
    React.useEffect(()=> { setList(applySort(raw, sort)); }, [sort, raw]);

    const SortBar = () => (
        <View style={{ flexDirection:"row", gap:16, paddingVertical:8, borderBottomWidth:1, borderColor:"#eee" }}>
            {[
                { key:"relevance", label:"综合" },
                { key: sort==="price_asc"?"price_desc":"price_asc", label:"价格" + (sort==="price_asc"?"↑":sort==="price_desc"?"↓":"") },
                { key:"newest", label:"新发" },
            ].map(it=>(
                <Pressable key={it.key} onPress={()=> setSort(it.key as Sort)}>
                    <Text style={{ fontWeight: sort===it.key ? "700" : "400" }}>{it.label}</Text>
                </Pressable>
            ))}
        </View>
    );

    return (
        <View style={{ flex:1, padding:12 }}>
            {/* 顶部搜索框 —— 点击回到“输入页” */}
            <Pressable onPress={()=> nav.navigate("Search", { q })} style={{ borderWidth:1, borderRadius:20, paddingHorizontal:14, paddingVertical:8, marginBottom:10 }}>
                <Text style={{ color:"#666" }}>{q || "搜索你要的宝贝"}</Text>
            </Pressable>

            {raw.length > 0 ? (
                <>
                    <SortBar />
                    <FlatList
                        data={list}
                        keyExtractor={i=>i.id}
                        renderItem={({item}) => <ProductCard item={item} onPress={() => nav.navigate("ProductDetail",{id:item.id})} />}
                    />
                </>
            ) : (
                <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
                    <Text style={{ color:"#888", marginBottom:8 }}>没有搜索结果</Text>
                    <Pressable onPress={()=> search(qParam)} style={{ paddingHorizontal:16, paddingVertical:10, backgroundColor:"#eee", borderRadius:8 }}>
                        <Text>刷新</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}
