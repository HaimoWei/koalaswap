// src/features/me/MyListingsScreen.tsx
import React from "react";
import { View, Text, FlatList, Pressable, Modal, TextInput, Button, Alert } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { ProductService } from "../../services/products";
import ProductCard from "../home/ProductCard";

export default function MyListingsScreen() {
    const { token } = useAuth();
    const nav = useNavigation<any>();
    const [list, setList] = React.useState<any[]>([]);
    const [priceModal, setPriceModal] = React.useState<{ visible: boolean; id?: string; price?: string }>({ visible: false });

    const load = React.useCallback(async () => {
        if (!token) return setList([]);
        const mine = await ProductService.listMine(token);
        setList(mine);
    }, [token]);

    useFocusEffect(React.useCallback(() => { load(); }, [load]));

    const openLowerPrice = (id: string, cur: number) => setPriceModal({ visible: true, id, price: String(cur) });
    const submitLowerPrice = async () => {
        const id = priceModal.id!;
        const p = Number(priceModal.price);
        if (isNaN(p) || p <= 0) { Alert.alert("提示", "请输入正确的价格"); return; }
        await ProductService.updatePrice(id, p, token!);
        setPriceModal({ visible: false });
        load();
    };

    return (
        <View style={{ flex: 1, padding: 12 }}>
            <FlatList
                data={list}
                keyExtractor={(i) => i.id}
                renderItem={({ item }) => (
                    <View style={{ marginBottom: 12, backgroundColor: "#fff", borderRadius: 12 }}>
                        <ProductCard item={item} onPress={() => nav.navigate("ProductPreview", { id: item.id })} />
                        <View style={{ flexDirection: "row", justifyContent: "flex-end", padding: 8, gap: 12 }}>
                            <Pressable onPress={() => nav.navigate("ProductEdit", { id: item.id })}>
                                <Text style={{ color: "#06c" }}>编辑</Text>
                            </Pressable>
                            <Pressable onPress={() => openLowerPrice(item.id, item.price)}>
                                <Text style={{ color: "#d2691e" }}>降价</Text>
                            </Pressable>
                        </View>
                    </View>
                )}
                ListEmptyComponent={<Text style={{ textAlign: "center", color: "#888", marginTop: 40 }}>还没有发布的商品</Text>}
            />

            <Modal transparent visible={priceModal.visible} onRequestClose={() => setPriceModal({ visible: false })}>
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", padding: 24 }}>
                    <View style={{ backgroundColor: "#fff", borderRadius: 12, padding: 16, gap: 12 }}>
                        <Text style={{ fontSize: 16, fontWeight: "700" }}>修改价格</Text>
                        <TextInput
                            value={priceModal.price}
                            onChangeText={(t) => setPriceModal((s) => ({ ...s, price: t }))}
                            keyboardType="numeric"
                            style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
                        />
                        <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12 }}>
                            <Button title="取消" onPress={() => setPriceModal({ visible: false })} />
                            <Button title="确定" onPress={submitLowerPrice} />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
