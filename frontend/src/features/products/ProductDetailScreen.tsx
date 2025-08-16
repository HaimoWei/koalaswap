// src/features/products/ProductDetailScreen.tsx
import React from "react";
import { View, Text, Image, Button, Alert, ScrollView } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ProductService } from "../../services/products";
import { UsersService, UserBrief } from "../../services/users";
import { useAuth } from "../../context/AuthContext";
import { FavoriteService } from "../../services/favorites";
import { OrderService } from "../../services/orders";
import { formatAUD } from "../../utils/currency";

type Params = { id: string };

export default function ProductDetailScreen() {
    const nav = useNavigation<any>();
    const { params } = useRoute<any>();
    const { user, token } = useAuth();
    const { id } = (params as Params) || ({} as Params);

    const [p, setP] = React.useState<any | null>(null);
    const [seller, setSeller] = React.useState<UserBrief | null>(null);

    const load = React.useCallback(async () => {
        const item = await ProductService.getById(id);
        setP(item);
        if (item?.sellerId) {
            const brief = await UsersService.getBrief(item.sellerId);
            setSeller(brief);
        }
    }, [id]);

    React.useEffect(() => { load(); }, [load]);

    if (!p) {
        return <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}><Text>加载中...</Text></View>;
    }

    const firstImage =
        Array.isArray(p.images) ? (typeof p.images[0] === "string" ? p.images[0] : p.images[0]?.imageUrl) : undefined;
    const isMine = user?.id === p.sellerId;

    const doFav = async () => { if (!token) return Alert.alert("请先登录"); await FavoriteService.toggle(token, id); Alert.alert("已收藏/取消收藏"); };
    const contact = () => Alert.alert("联系卖家", "这里接入聊天/拨号等功能");
    const buyNow = async () => { if (!token) return Alert.alert("请先登录"); await OrderService.buyNow(token, id); Alert.alert("下单成功（占位）"); };
    const comment = () => Alert.alert("评论", "这里跳转到评论页（占位）");

    return (
        <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
                {firstImage && <Image source={{ uri: firstImage }} style={{ width: "100%", height: 240, borderRadius: 12 }} />}
                <Text style={{ fontSize: 22, fontWeight: "700" }}>{formatAUD(p.price)}</Text>
                <Text style={{ fontSize: 18 }}>{p.title}</Text>
                <Text style={{ color: "#666" }}>{p.description}</Text>

                {seller && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 }}>
                        {seller.avatarUrl ? (
                            <Image source={{ uri: seller.avatarUrl }} style={{ width: 32, height: 32, borderRadius: 16 }} />
                        ) : (
                            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#ddd", alignItems: "center", justifyContent: "center" }}>
                                <Text style={{ fontSize: 14, color: "#666" }}>{seller.displayName?.slice(0, 1) ?? "?"}</Text>
                            </View>
                        )}
                        <Text style={{ fontSize: 16 }}>{seller.displayName}</Text>
                    </View>
                )}
            </ScrollView>

            <View style={{ flexDirection: "row", justifyContent: "space-around", padding: 12, borderTopWidth: 1, borderColor: "#eee" }}>
                <Button title="收藏" onPress={doFav} />
                {!isMine && <Button title="联系卖家" onPress={contact} />}
                {!isMine && <Button title="立即购买" onPress={buyNow} />}
                <Button title="评论" onPress={comment} />
            </View>
        </View>
    );
}

