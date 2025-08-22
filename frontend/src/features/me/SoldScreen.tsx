// src/features/me/SoldScreen.tsx
import React from "react";
import { View, Text, FlatList, Button, RefreshControl, Alert } from "react-native";
import { OrderService } from "../../services/orders";
import { useAuth } from "../../context/AuthContext";
import { formatAUD } from "../../utils/currency";

export default function SoldScreen() {
    const { token } = useAuth();
    const [list, setList] = React.useState<any[]>([]);
    const [refreshing, setRefreshing] = React.useState(false);

    const load = React.useCallback(async () => {
        if (!token) return;
        try {
            setRefreshing(true);
            const data = await OrderService.sold(token);
            setList(Array.isArray((data as any)?.content) ? (data as any).content : (data as any));
        } catch (e: any) {
            Alert.alert("加载失败", e?.message || String(e));
        } finally {
            setRefreshing(false);
        }
    }, [token]);

    React.useEffect(() => { load(); }, [load]);

    async function update(id: string, op: (id: string, ...args: any[]) => Promise<any>) {
        try {
            const next = await op(id);
            setList((prev) => prev.map((x: any) => (x.id === id ? next : x)));
        } catch (e: any) {
            Alert.alert("操作失败", e?.message || String(e));
        }
    }

    return (
        <View style={{ flex: 1, padding: 12 }}>
            <FlatList
                data={list}
                keyExtractor={(i) => i.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
                renderItem={({ item }) => {
                    const actions: React.ReactNode[] = [];
                    if (item.status === "PENDING") {
                        actions.push(<Button key="cancel" title="取消" onPress={() => update(item.id, (id) => OrderService.cancel(id))} />);
                    } else if (item.status === "PAID") {
                        actions.push(<Button key="ship" title="发货" onPress={() => update(item.id, (id) => OrderService.ship(id))} />);
                    }
                    return (
                        <View style={{ padding: 12, borderWidth: 1, borderRadius: 12, marginBottom: 8, gap: 6 }}>
                            <Text>已卖出 订单 {item.id}</Text>
                            <Text>金额 {formatAUD(item.priceSnapshot)}</Text>
                            <Text>状态 {item.status}</Text>
                            <View style={{ flexDirection: "row", gap: 8 }}>{actions}</View>
                        </View>
                    );
                }}
            />
        </View>
    );
}
