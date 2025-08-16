// src/features/products/ProductPreviewScreen.tsx
import React from "react";
import { View, Text, Image, ScrollView, Pressable, Alert } from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { ProductService } from "../../services/products";
import { formatAUD } from "../../utils/currency";

export default function ProductPreviewScreen() {
    const nav = useNavigation<any>();
    const route = useRoute<any>();
    const { id } = route.params as { id: string };
    const { token } = useAuth();

    const [item, setItem] = React.useState<any | null>(null);

    const load = React.useCallback(async () => {
        const p = await ProductService.getById(id);
        setItem(p);
    }, [id]);

    useFocusEffect(React.useCallback(() => { load(); }, [load]));

    const doUnlist = async () => {
        if (!token) return Alert.alert("请先登录");
        await ProductService.unlist(id, token);
        await load();
        Alert.alert("已下架");
    };

    const doRelist = async () => {
        if (!token) return Alert.alert("请先登录");
        await ProductService.relist(id, token);
        await load();
        Alert.alert("已上架");
    };

    const goEdit = () => {
        nav.navigate("ProductEdit", { id });
    };

    if (!item) {
        return (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <Text>加载中...</Text>
            </View>
        );
    }

    const firstImage =
        Array.isArray(item.images)
            ? (typeof item.images[0] === "string" ? item.images[0] : item.images[0]?.imageUrl)
            : undefined;

    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={{ flex: 1 }}>
                {firstImage && <Image source={{ uri: firstImage }} style={{ width: "100%", height: 260 }} />}
                <View style={{ padding: 12, gap: 6 }}>
                    <Text style={{ fontSize: 20, fontWeight: "700" }}>{formatAUD(item.price)}</Text>
                    <Text style={{ fontSize: 16 }}>{item.title}</Text>
                    <Text style={{ color: "#666" }}>{item.description}</Text>
                </View>
            </ScrollView>

            {/* 底部操作区：上/下架 + 编辑（移除“删除”，后端暂未提供硬删除） */}
            <View style={{ flexDirection: "row", justifyContent: "space-around", padding: 12, borderTopWidth: 1, borderColor: "#eee" }}>
                {item.isActive !== false ? (
                    <Pressable onPress={doUnlist}><Text style={{ color: "#a00" }}>下架</Text></Pressable>
                ) : (
                    <Pressable onPress={doRelist}><Text style={{ color: "#0a7" }}>上架</Text></Pressable>
                )}
                <Pressable onPress={goEdit}><Text style={{ color: "#06c" }}>编辑</Text></Pressable>
            </View>
        </View>
    );
}
