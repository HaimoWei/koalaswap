// src/features/me/SoldScreen.tsx
import React from "react";
import { View, Text, FlatList, Button, RefreshControl, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { OrderService } from "../../services/orders";
import { useAuth } from "../../context/AuthContext";
import { formatAUD } from "../../utils/currency";
import { ChatService } from "../../services/chat"; // ✅ 新增

// 兼容分页结构（content/number/page/totalPages）
function normalizePage<T>(res: any): { content: T[]; pageIndex: number; totalPages: number } {
    const content: T[] = Array.isArray(res) ? res : (res?.content ?? []);
    const pageIndex =
        typeof res?.page === "number" ? res.page : typeof res?.number === "number" ? res.number : 0;
    const totalPages = typeof res?.totalPages === "number" ? res.totalPages : 1;
    return { content, pageIndex, totalPages };
}

export default function SoldScreen() {
    const nav = useNavigation<any>();
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

    React.useEffect(() => {
        load();
    }, [load]);

    async function update(id: string, op: (id: string, ...args: any[]) => Promise<any>) {
        try {
            const next = await op(id);
            setList((prev) => prev.map((x: any) => (x.id === id ? next : x)));
        } catch (e: any) {
            Alert.alert("操作失败", e?.message || String(e));
        }
    }

    // ✅ 新增：从“我卖出的”拉起聊天（卖家→买家）
    const contactBuyer = async (order: any) => {
        try {
            if (!order?.productId || !order?.buyerId || !order?.sellerId) {
                Alert.alert("无法发起聊天", "缺少商品/买家/卖家信息");
                return;
            }

            // 由于后端创建会话只允许买家侧，这里从列表里查找已存在的会话
            let page = 0;
            let found: any | null = null;

            // 放大 size，尽量一次命中；如很多会话则翻页查找
            while (true) {
                const res = await ChatService.listConversations({ page, size: 50, aggregate: true });
                const norm = normalizePage<any>(res);
                found =
                    norm.content.find(
                        (c: any) =>
                            String(c.productId) === String(order.productId) &&
                            String(c.buyerId) === String(order.buyerId) &&
                            String(c.sellerId) === String(order.sellerId)
                    ) || null;

                if (found || page + 1 >= norm.totalPages) break;
                page += 1;
            }

            if (!found) {
                Alert.alert(
                    "未找到相关会话",
                    "对方尚未与你发起聊天。可让买家从订单/商品详情页点“联系卖家”后再来此进入。"
                );
                return;
            }

            // 跳转聊天，顺便把聚合出来的头像/昵称/首图传给 seed（有就展示）
            nav.navigate("ChatDetail", {
                conversationId: found.id,
                seed: {
                    productFirstImage: found.productFirstImage,
                    orderStatus: found.orderStatus,
                    peerNickname: found.peerNickname ?? null,
                    peerAvatar: found.peerAvatar ?? null,
                },
            });
        } catch (e: any) {
            Alert.alert("发起聊天失败", e?.message || String(e));
        }
    };

    return (
        <View style={{ flex: 1, padding: 12 }}>
            <FlatList
                data={list}
                keyExtractor={(i) => i.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
                renderItem={({ item }) => {
                    const actions: React.ReactNode[] = [];

                    if (item.status === "PENDING") {
                        actions.push(
                            <Button
                                key="cancel"
                                title="取消"
                                onPress={() => update(item.id, (id) => OrderService.cancel(id))}
                            />
                        );
                    } else if (item.status === "PAID") {
                        actions.push(
                            <Button
                                key="ship"
                                title="发货"
                                onPress={() => update(item.id, (id) => OrderService.ship(id))}
                            />
                        );
                    }

                    // ✅ 新增按钮：联系买家（字段齐全时显示）
                    if (item.productId && item.buyerId && item.sellerId) {
                        actions.push(
                            <Button key="chat" title="联系买家" onPress={() => contactBuyer(item)} />
                        );
                    }

                    return (
                        <View
                            style={{
                                padding: 12,
                                borderWidth: 1,
                                borderRadius: 12,
                                marginBottom: 8,
                                gap: 6,
                            }}
                        >
                            <Text>已卖出 订单 {item.id}</Text>
                            <Text>金额 {formatAUD(item.priceSnapshot)}</Text>
                            <Text>状态 {item.status}</Text>
                            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>{actions}</View>
                        </View>
                    );
                }}
            />
        </View>
    );
}
