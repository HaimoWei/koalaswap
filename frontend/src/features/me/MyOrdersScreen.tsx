// src/features/me/MyOrdersScreen.tsx
import React from "react";
import { View, Text, FlatList, Button, RefreshControl, Alert, Modal, Image } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { OrderService } from "../../services/orders";
import { useAuth } from "../../context/AuthContext";
import { formatAUD } from "../../utils/currency";
import { ChatService } from "../../services/chat"; // ✅ 新增

type PendingParams = {
    pendingOrderId?: string;
    pendingSnapshot?: { title?: string; price?: number; shippingFee?: number; image?: string };
    prevRouteName?: string;
    prevRouteParams?: any;
    payMethodDefault?: "ALIPAY" | "HUABEI";
};

export default function MyOrdersScreen() {
    const nav = useNavigation<any>();
    const route = useRoute<any>();
    const { token } = useAuth();

    const [list, setList] = React.useState<any[]>([]);
    const [refreshing, setRefreshing] = React.useState(false);

    // —— 待支付覆盖层状态 —— //
    const params: PendingParams = (route.params || {}) as any;
    const [pendingVisible, setPendingVisible] = React.useState<boolean>(!!params.pendingOrderId);
    const [payMethod, setPayMethod] = React.useState<"ALIPAY" | "HUABEI">(params.payMethodDefault || "ALIPAY");
    const [paying, setPaying] = React.useState(false);
    const orderId = params.pendingOrderId;

    const load = React.useCallback(async () => {
        if (!token) return;
        try {
            setRefreshing(true);
            const data = await OrderService.myOrders(token);
            setList(Array.isArray((data as any)?.content) ? (data as any).content : (data as any));
        } catch (e: any) {
            Alert.alert("加载失败", e?.message || String(e));
        } finally {
            setRefreshing(false);
        }
    }, [token]);

    React.useEffect(() => { load(); }, [load]);

    async function update(id: string, op: (id: string) => Promise<any>) {
        try {
            const next = await op(id);
            setList((prev) => prev.map((x: any) => (x.id === id ? next : x)));
        } catch (e: any) {
            Alert.alert("操作失败", e?.message || String(e));
        }
    }

    // —— 覆盖层行为 —— //
    const closePendingAndBack = () => {
        setPendingVisible(false);
        if (params.prevRouteName) {
            nav.navigate(params.prevRouteName, params.prevRouteParams);
        } else {
            nav.goBack();
        }
    };

    const repay = async () => {
        if (!orderId) return;
        try {
            setPaying(true);
            await OrderService.pay(orderId, payMethod);
            setPendingVisible(false);
            Alert.alert("支付成功", "", [{ text: "好的" }]);
            load();
        } catch (e: any) {
            Alert.alert("支付失败", e?.message || String(e));
        } finally {
            setPaying(false);
        }
    };

    const cancelPending = async () => {
        if (!orderId) return;
        try {
            await OrderService.cancel(orderId);
            setPendingVisible(false);
            Alert.alert("订单已取消");
            closePendingAndBack();
        } catch (e: any) {
            Alert.alert("取消失败", e?.message || String(e));
        }
    };

    // ✅ 新增：从订单拉起聊天
    const contactFromOrder = async (order: any) => {
        try {
            if (!order?.productId || !order?.sellerId) {
                Alert.alert("无法发起聊天", "缺少商品或卖家信息");
                return;
            }
            const conv = await ChatService.createOrGetConversation({
                productId: String(order.productId),
                orderId: String(order.id),
                sellerId: String(order.sellerId),
            });
            nav.navigate("ChatDetail", {
                conversationId: conv.id,
                seed: { productFirstImage: conv.productFirstImage, orderStatus: conv.orderStatus },
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

                    // 状态相关操作（原样保留）
                    if (item.status === "PENDING") {
                        actions.push(<Button key="pay" title="支付" onPress={() => update(item.id, (id) => OrderService.pay(id))} />);
                        actions.push(<Button key="cancel" title="取消" onPress={() => update(item.id, (id) => OrderService.cancel(id))} />);
                    } else if (item.status === "PAID") {
                        actions.push(<Button key="cancel" title="取消" onPress={() => update(item.id, (id) => OrderService.cancel(id))} />);
                    } else if (item.status === "SHIPPED") {
                        actions.push(<Button key="confirm" title="确认收货" onPress={() => update(item.id, (id) => OrderService.confirm(id))} />);
                    }

                    // ✅ 新增：联系对方（字段齐全时显示）
                    if (item.productId && item.sellerId) {
                        actions.push(<Button key="chat" title="联系对方" onPress={() => contactFromOrder(item)} />);
                    }

                    return (
                        <View style={{ padding: 12, borderWidth: 1, borderRadius: 12, marginBottom: 8, gap: 6 }}>
                            <Text>订单 {item.id}</Text>
                            <Text>金额 {formatAUD(item.priceSnapshot)}</Text>
                            <Text>状态 {item.status}</Text>
                            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>{actions}</View>
                        </View>
                    );
                }}
            />

            {/* —— 待支付覆盖层（仅在从下单失败场景带参数进入时显示） —— */}
            <Modal visible={pendingVisible} transparent animationType="slide" onRequestClose={closePendingAndBack}>
                <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.45)", justifyContent:"flex-end" }}>
                    <View style={{ backgroundColor:"#fff", borderTopLeftRadius:16, borderTopRightRadius:16, padding:16 }}>
                        {/* 头部提示 */}
                        <Text style={{ fontSize:16, fontWeight:"600", marginBottom:12 }}>支付失败</Text>
                        <Text style={{ color:"#666", marginBottom:12 }}>订单已为你保存在「我买到的」，请在30分钟内完成付款，否则将自动取消。</Text>

                        {/* 商品摘要 */}
                        <View style={{ flexDirection:"row", gap:12, alignItems:"center", marginBottom:8 }}>
                            {params.pendingSnapshot?.image ? (
                                <Image source={{ uri: params.pendingSnapshot.image }} style={{ width:56, height:56, borderRadius:8 }} />
                            ) : null}
                            <View style={{ flex:1 }}>
                                <Text numberOfLines={1} style={{ fontSize:15, fontWeight:"500" }}>
                                    {params.pendingSnapshot?.title || "待支付订单"}
                                </Text>
                                <Text style={{ marginTop:4, fontSize:16, color:"#FF5000" }}>
                                    {formatAUD((params.pendingSnapshot?.price || 0) + (params.pendingSnapshot?.shippingFee || 0))}
                                </Text>
                            </View>
                        </View>

                        {/* 支付方式选择 */}
                        <View style={{ marginTop:8, marginBottom:8 }}>
                            <Text style={{ fontSize:14, color:"#999" }}>支付方式</Text>
                            <View style={{ flexDirection:"row", marginTop:8, gap:12 }}>
                                <Button title={`支付宝${payMethod==="ALIPAY" ? " ✓" : ""}`} onPress={() => setPayMethod("ALIPAY")} />
                                <Button title={`花呗${payMethod==="HUABEI" ? " ✓" : ""}`} onPress={() => setPayMethod("HUABEI")} />
                            </View>
                        </View>

                        {/* 底部操作 */}
                        <View style={{ flexDirection:"row", gap:12, marginTop:12 }}>
                            <View style={{ flex:1 }}>
                                <Button title="返回" onPress={closePendingAndBack} />
                            </View>
                            <View style={{ flex:1 }}>
                                <Button title="取消订单" onPress={cancelPending} />
                            </View>
                            <View style={{ flex:1.2 }}>
                                <Button title={paying ? "支付中..." : "重新支付"} onPress={repay} disabled={paying} />
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
