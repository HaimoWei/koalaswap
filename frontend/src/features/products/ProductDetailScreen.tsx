import React from "react";
import { View, Text, Image, Button, Alert, ScrollView } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ProductService } from "../../services/products";
import { useAuth } from "../../context/AuthContext";
import { useRequireAuth } from "../../context/useRequireAuth";
import { FavoriteService } from "../../services/favorites";
import { OrderService } from "../../services/orders";

type Params = { id: string };

export default function ProductDetailScreen() {
    const nav = useNavigation<any>();
    const { params } = useRoute<any>();
    const { user, token } = useAuth();
    const ensureAuth = useRequireAuth();
    const id = (params as Params).id;

    const [p, setP] = React.useState<any | null>(null);
    const [fav, setFav] = React.useState(false);

    React.useEffect(() => { ProductService.getById(id).then(setP).catch(e => Alert.alert("错误", e?.message || "加载失败")); }, [id]);
    React.useEffect(() => { if (token) FavoriteService.isFav(token, id).then(r => setFav(r.fav)); }, [token, id]);

    if (!p) return <View style={{ flex:1 }} />;

    const mine = user?.id === p.sellerId;

    const toggleFav = () => ensureAuth(async () => {
        const r = await FavoriteService.toggle(token!, id); setFav(r.fav);
    });
    const buyNow = () => ensureAuth(async () => {
        await OrderService.buyNow(token!, id);
        Alert.alert("下单成功", "已生成订单（离线）");
    });

    return (
        <View style={{ flex:1 }}>
            <ScrollView contentContainerStyle={{ padding:16, gap:12 }}>
                {p.images?.[0]?.imageUrl && <Image source={{ uri: p.images[0].imageUrl }} style={{ width:"100%", height:240, borderRadius:12 }} />}
                <Text style={{ fontSize:22, fontWeight:"700" }}>A${p.price} {p.freeShipping ? "· 包邮" : ""}</Text>
                <Text style={{ fontSize:18 }}>{p.title}</Text>
                <Text style={{ color:"#666" }}>{p.description}</Text>
                <Text style={{ color:"#888" }}>成色：{p.condition}</Text>
                {p.seller && <Text style={{ color:"#888" }}>卖家：{p.seller.displayName}</Text>}
            </ScrollView>

            {/* 底部操作条 */}
            <View style={{ flexDirection:"row", gap:8, padding:10, borderTopWidth:1, borderColor:"#eee", backgroundColor:"#fff" }}>
                {mine ? (
                    <Button title="管理" onPress={() => nav.navigate("ProductPreview", { id })} />
                ) : (
                    <>
                        <Button title={fav ? "已收藏" : "收藏"} onPress={toggleFav} />
                        <Button title="留言" onPress={() => Alert.alert("占位","留言功能离线占位")} />
                        <Button title="聊一聊" onPress={() => Alert.alert("占位","聊天功能离线占位")} />
                        <View style={{ flex:1 }} />
                        <Button title="立即购买" onPress={buyNow} />
                    </>
                )}
            </View>
        </View>
    );
}
