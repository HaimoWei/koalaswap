import React from "react";
import { View, Text, FlatList, RefreshControl, Pressable, Alert } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import ProductCard from "../home/ProductCard";
import ProductService from "../../services/products";

type Tab = "onsale" | "hidden";

export default function MyListingsScreen() {
    const nav = useNavigation<any>();
    const [tab, setTab] = React.useState<Tab>("onsale");
    const [page, setPage] = React.useState(0);
    const [size] = React.useState(12);
    const [items, setItems] = React.useState<any[]>([]);
    const [totalPages, setTotalPages] = React.useState(1);
    const [loading, setLoading] = React.useState(false);

    const load = React.useCallback(async (t: Tab = tab, p = 0) => {
        setLoading(true);
        try {
            const res: any = await ProductService.listMine(t, p, size, "createdAt,desc");
            setItems(res.content || []);
            setTotalPages(res.totalPages || 1);
            setPage(p);
        } catch (e: any) {
            Alert.alert("加载失败", e?.message || String(e));
        } finally {
            setLoading(false);
        }
    }, [size, tab]);

    useFocusEffect(React.useCallback(() => { load(tab, 0); }, [load, tab]));

    const switchTab = (t: Tab) => {
        setTab(t);
        load(t, 0);
    };

    const doHide = async (id: string) => {
        try {
            await ProductService.hide(id);
            Alert.alert("已下架");
            load(tab, page);
        } catch (e: any) {
            Alert.alert("操作失败", e?.message || String(e));
        }
    };

    const doRelist = async (id: string) => {
        // 需求：重新上架 → 进入编辑页面，保存时发布
        nav.navigate("ProductEdit", { id, relist: true });
    };

    const doDeleteHard = async (id: string) => {
        Alert.alert("确定删除？", "删除后不可恢复，且有过订单记录的商品无法删除。", [
            { text: "取消" },
            {
                text: "删除",
                style: "destructive",
                onPress: async () => {
                    try {
                        await ProductService.removeHard(id);
                        Alert.alert("已删除");
                        load(tab, page);
                    } catch (e: any) {
                        Alert.alert("删除失败", e?.message || String(e));
                    }
                },
            },
        ]);
    };

    const renderItem = ({ item }: { item: any }) => {
        const actions: React.ReactNode[] = [];

        if (tab === "onsale") {
            actions.push(
                <Pressable key="hide" onPress={() => doHide(item.id)}>
                    <Text style={{ color: "#a00", paddingHorizontal: 8, paddingVertical: 4 }}>下架</Text>
                </Pressable>
            );
            actions.push(
                <Pressable key="edit" onPress={() => nav.navigate("ProductEdit", { id: item.id })}>
                    <Text style={{ color: "#06c", paddingHorizontal: 8, paddingVertical: 4 }}>编辑</Text>
                </Pressable>
            );
        } else {
            actions.push(
                <Pressable key="relist" onPress={() => doRelist(item.id)}>
                    <Text style={{ color: "#0a7", paddingHorizontal: 8, paddingVertical: 4 }}>重新上架</Text>
                </Pressable>
            );
            actions.push(
                <Pressable key="delete" onPress={() => doDeleteHard(item.id)}>
                    <Text style={{ color: "#d11", paddingHorizontal: 8, paddingVertical: 4 }}>彻底删除</Text>
                </Pressable>
            );
        }

        return (
            <View style={{ marginBottom: 12, backgroundColor: "#fff", borderRadius: 12, overflow: "hidden" }}>
                <ProductCard item={item} onPress={() => nav.navigate("ProductPreview", { id: item.id })} />
                <View style={{ flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 12, paddingBottom: 10 }}>
                    {actions}
                </View>
            </View>
        );
    };

    const TabChip = ({ t, label }: { t: Tab; label: string }) => (
        <Pressable
            onPress={() => switchTab(t)}
            style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                backgroundColor: tab === t ? "#222" : "#eee",
                marginRight: 8,
            }}
        >
            <Text style={{ color: tab === t ? "#fff" : "#333" }}>{label}</Text>
        </Pressable>
    );

    return (
        <View style={{ flex: 1, padding: 12 }}>
            <View style={{ flexDirection: "row", marginBottom: 10 }}>
                <TabChip t="onsale" label="在售" />
                <TabChip t="hidden" label="已下架" />
            </View>

            <FlatList
                data={items}
                keyExtractor={(it) => it.id}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={() => load(tab, page)} />}
                renderItem={renderItem}
                ListEmptyComponent={<Text style={{ textAlign: "center", color: "#888", marginTop: 40 }}>暂无数据</Text>}
            />

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
                <Pressable onPress={() => load(tab, Math.max(0, page - 1))} disabled={page <= 0 || loading}>
                    <Text style={{ padding: 10, color: page <= 0 || loading ? "#bbb" : "#06c" }}>上一页</Text>
                </Pressable>
                <Text>第 {page + 1}/{totalPages} 页</Text>
                <Pressable onPress={() => load(tab, Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1 || loading}>
                    <Text style={{ padding: 10, color: page >= totalPages - 1 || loading ? "#bbb" : "#06c" }}>下一页</Text>
                </Pressable>
            </View>
        </View>
    );
}
