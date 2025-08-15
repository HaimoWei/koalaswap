// src/features/products/ProductPreviewScreen.tsx
import React from "react";
import { View, Text, Image, ScrollView, Pressable, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { ProductService } from "../../services/products";

export default function ProductPreviewScreen() {
    const nav = useNavigation<any>();
    const route = useRoute<any>();
    const { id } = route.params as { id: string };
    const { token, user } = useAuth();

    const [item, setItem] = React.useState<any | null>(null);

    const load = React.useCallback(async () => {
        const p = await ProductService.getById(id);
        setItem(p);
    }, [id]);

    React.useEffect(() => { load(); }, [load]);

    if (!item) return <View style={{flex:1, alignItems:"center", justifyContent:"center"}}><Text>加载中...</Text></View>;

    const isOwner = user?.id === item.sellerId;

    const doUnlist = async () => {
        await ProductService.unlist(item.id, token!);
        Alert.alert("已下架");
        load();
    };
    const doRelist = async () => {
        await ProductService.relist(item.id, token!);
        Alert.alert("已上架");
        load();
    };
    const doDelete = async () => {
        Alert.alert("确认删除", "删除后不可恢复", [
            { text: "取消", style: "cancel" },
            { text: "删除", style: "destructive", onPress: async () => {
                    await ProductService.remove(token!, item.id);
                    Alert.alert("已删除");
                    nav.goBack();
                } },
        ]);
    };

    return (
        <View style={{ flex:1 }}>
            <ScrollView style={{ flex:1 }}>
                <Image source={{ uri: item.images?.[0]?.imageUrl }} style={{ width:"100%", height:260 }} />
                <View style={{ padding:12, gap:6 }}>
                    <Text style={{ fontSize:20, fontWeight:"700" }}>¥{item.price}</Text>
                    <Text style={{ fontSize:16 }}>{item.title}</Text>
                    <Text style={{ color:"#666" }}>{item.description}</Text>
                    <Text style={{ color:"#999", marginTop:8 }}>成色：{item.condition}  {item.freeShipping ? "包邮" : "不包邮"}</Text>
                    {!item.isActive && <Text style={{ color:"#d11", marginTop:8 }}>状态：已下架</Text>}
                </View>
            </ScrollView>

            {isOwner && (
                <View style={{ flexDirection:"row", justifyContent:"space-around", padding:12, borderTopWidth:1, borderColor:"#eee" }}>
                    <Pressable onPress={()=> nav.navigate("ProductEdit", { id: item!.id })}>
                        <Text style={{ color:"#06c" }}>编辑</Text>
                    </Pressable>

                    {item.isActive ? (
                        <Pressable onPress={doUnlist}>
                            <Text style={{ color:"#d11" }}>下架</Text>
                        </Pressable>
                    ) : (
                        <Pressable onPress={doRelist}>
                            <Text style={{ color:"#0a7" }}>上架</Text>
                        </Pressable>
                    )}

                    <Pressable onPress={doDelete}>
                        <Text style={{ color:"#555" }}>删除</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}
