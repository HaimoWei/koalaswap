import React from "react";
import { View, Text, Image, Button, Alert, ScrollView, Modal, Pressable } from "react-native";
import { useNavigation, useRoute, StackActions } from "@react-navigation/native";
import { ProductService } from "../../services/products";
import { UsersService, UserBrief } from "../../services/users";
import { useAuth } from "../../context/AuthContext";
import { FavoriteService } from "../../services/favorites";
import { OrderService } from "../../services/orders";
import { formatAUD } from "../../utils/currency";

type Params = { id: string };

export default function ProductDetailScreen() {
    const nav = useNavigation<any>();
    const route = useRoute<any>();
    const { user, token } = useAuth();
    const { id } = (route.params as Params) || ({} as Params);
    const [isFav, setIsFav] = React.useState(false);
    const [p, setP] = React.useState<any | null>(null);
    const [seller, setSeller] = React.useState<UserBrief | null>(null);

    // —— 下单确认弹窗状态 —— //
    const [confirmVisible, setConfirmVisible] = React.useState(false);
    const [payMethod, setPayMethod] = React.useState<"ALIPAY" | "HUABEI">("ALIPAY");
    const [submitting, setSubmitting] = React.useState(false);

    // 占位的地址与运费（后续接入你的地址模块与运费计算）
    const [address] = React.useState<string>("默认收货地址（占位，可在个人中心维护）");
    const [shippingFee] = React.useState<number>(0);

    const load = React.useCallback(async () => {
        const item = await ProductService.getById(id);
        setP(item);
        if (item?.sellerId) {
            const brief = await UsersService.getBrief(item.sellerId);
            setSeller(brief);
        }
        try {
            if (token) {
                const fav = await FavoriteService.isFav(token, id);
                setIsFav(!!fav);
            } else {
                setIsFav(false);
            }
        } catch {}
    }, [id, token]);

    React.useEffect(() => {
        load();
    }, [load]);

    if (!p) {
        return <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}><Text>加载中...</Text></View>;
    }

    const firstImage = Array.isArray(p.images) ? (typeof p.images[0] === "string" ? p.images[0] : p.images[0]?.imageUrl) : undefined;
    const isMine = user?.id && p?.sellerId && String(user.id) === String(p.sellerId);

    const doFav = async () => {
        if (!token) return Alert.alert("请先登录");
        try {
            const res = await FavoriteService.toggle(token, id);
            const next = (res && typeof (res as any).fav === "boolean")
                ? (res as any).fav
                : await FavoriteService.isFav(token, id);
            setIsFav(!!next);
            Alert.alert(next ? "已加入收藏" : "已取消收藏");
        } catch (e: any) {
            Alert.alert("操作失败", e?.message || String(e));
        }
    };

    const contact = () => Alert.alert("联系卖家", "这里接入聊天/拨号等功能");

    // 点击“立即购买” -> 打开确认弹窗
    const openConfirm = () => {
        if (!token) return Alert.alert("请先登录");
        if (isMine) return Alert.alert("不能购买自己发布的商品");
        setConfirmVisible(true);
    };

    // —— 工具：获取进入“详情页”前的上一页（便于返回） —— //
    const getPrevRoute = () => {
        const state = nav.getState?.();
        const prev = state?.routes?.[state.index - 1];
        return { prevRouteName: prev?.name, prevRouteParams: prev?.params };
    };

    // 确认购买：先创建订单，再尝试支付
    const submitOrder = async () => {
        if (!token) return Alert.alert("请先登录");
        try {
            setSubmitting(true);
            // 1) 创建订单（后端会返回 PENDING）
            const newOrder = await OrderService.buyNow(token, id);

            try {
                // 2) 发起支付（可能失败）
                await OrderService.pay(newOrder.id, payMethod);
                setConfirmVisible(false);

                // ✅ 支付成功：用 replace 将“我买到的”替换当前“详情页”
                const { prevRouteName, prevRouteParams } = getPrevRoute();
                nav.dispatch(
                    StackActions.replace("MyOrders", {
                        highlightOrderId: newOrder.id,
                        prevRouteName,
                        prevRouteParams,
                    })
                );
                Alert.alert("支付成功");
            } catch (e: any) {
                // 3) 支付失败：关闭弹窗 -> 用 replace 进入“我买到的”并显示待支付覆盖层
                setConfirmVisible(false);

                const { prevRouteName, prevRouteParams } = getPrevRoute();
                nav.dispatch(
                    StackActions.replace("MyOrders", {
                        pendingOrderId: newOrder.id,
                        pendingSnapshot: {
                            title: p.title,
                            price: p.price,
                            shippingFee,
                            image: firstImage,
                        },
                        prevRouteName,
                        prevRouteParams,
                        payMethodDefault: payMethod,
                    })
                );

                Alert.alert(
                    "支付失败",
                    "订单已为你保存在「我买到的」，请在30分钟内完成付款，否则将自动取消。"
                );
            }
        } catch (e: any) {
            Alert.alert("下单失败", e?.message || String(e));
        } finally {
            setSubmitting(false);
        }
    };

    const comment = () => Alert.alert("评论", "这里跳转到评论页（占位）");

    return (
        <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
                {firstImage && <Image source={{ uri: firstImage }} style={{ width: "100%", height: 240, borderRadius: 12 }} />}
                <Text style={{ fontSize: 22, fontWeight: "700" }}>{formatAUD(p.price)}</Text>
                <Text style={{ fontSize: 18 }}>{p.title}</Text>
                <Text style={{ color: "#666" }}>{p.description}</Text>

                {seller && (
                    <Pressable onPress={() => nav.navigate("SellerProfile", { id: String(p.sellerId) })}>
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
                    </Pressable>
                )}
            </ScrollView>

            <View style={{ flexDirection: "row", justifyContent: "space-around", padding: 12, borderTopWidth: 1, borderColor: "#eee" }}>
                <Button title={isFav ? "取消收藏" : "收藏"} // [FIX] 收藏按钮根据状态切换
                        onPress={doFav} />
                {!isMine && <Button title="联系卖家" onPress={contact} />}
                {!isMine && <Button title="立即购买" onPress={openConfirm} />}
                <Button title="评论" onPress={comment} />
            </View>

            {/* —— 下单确认弹窗 —— */}
            <Modal visible={confirmVisible} transparent animationType="slide" onRequestClose={() => setConfirmVisible(false)}>
                <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.45)", justifyContent:"flex-end" }}>
                    <View style={{ backgroundColor:"#fff", borderTopLeftRadius:16, borderTopRightRadius:16, padding:16, gap:12 }}>
                        {/* 商品摘要 */}
                        <View style={{ flexDirection:"row", gap:12, alignItems:"center" }}>
                            {firstImage && <Image source={{ uri:firstImage }} style={{ width:56, height:56, borderRadius:8 }} />}
                            <View style={{ flex:1 }}>
                                <Text numberOfLines={1} style={{ fontSize:16, fontWeight:"600" }}>{p.title}</Text>
                                <Text style={{ marginTop:4, fontSize:16, color:"#FF5000" }}>{formatAUD(p.price)}</Text>
                            </View>
                        </View>

                        {/* 地址（占位） */}
                        <View style={{ paddingVertical:8 }}>
                            <Text style={{ fontSize:14, color:"#999" }}>收货地址</Text>
                            <View style={{ marginTop:4, padding:10, borderRadius:10, backgroundColor:"#f7f7f7" }}>
                                <Text style={{ fontSize:15 }}>{address}</Text>
                            </View>
                        </View>

                        {/* 运费 */}
                        <View style={{ flexDirection:"row", justifyContent:"space-between", paddingVertical:2 }}>
                            <Text style={{ fontSize:15, color:"#444" }}>运费</Text>
                            <Text style={{ fontSize:15 }}>{shippingFee > 0 ? formatAUD(shippingFee) : "包邮"}</Text>
                        </View>

                        {/* 支付方式 */}
                        <View style={{ marginTop:8 }}>
                            <Text style={{ fontSize:14, color:"#999" }}>支付方式</Text>
                            <Pressable onPress={() => setPayMethod("ALIPAY")} style={{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingVertical:10 }}>
                                <Text style={{ fontSize:16 }}>支付宝支付</Text>
                                <View style={{ width:20, height:20, borderRadius:10, borderWidth:2, borderColor: payMethod==="ALIPAY" ? "#FFCC00" : "#ccc", alignItems:"center", justifyContent:"center" }}>
                                    {payMethod==="ALIPAY" && <View style={{ width:10, height:10, borderRadius:5, backgroundColor:"#FFCC00" }}/>}
                                </View>
                            </Pressable>
                            <Pressable onPress={() => setPayMethod("HUABEI")} style={{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingVertical:10 }}>
                                <Text style={{ fontSize:16 }}>花呗支付</Text>
                                <View style={{ width:20, height:20, borderRadius:10, borderWidth:2, borderColor: payMethod==="HUABEI" ? "#FFCC00" : "#ccc", alignItems:"center", justifyContent:"center" }}>
                                    {payMethod==="HUABEI" && <View style={{ width:10, height:10, borderRadius:5, backgroundColor:"#FFCC00" }}/>}
                                </View>
                            </Pressable>
                        </View>

                        {/* 底部操作 */}
                        <View style={{ flexDirection:"row", gap:12, marginTop:8 }}>
                            <View style={{ flex:1 }}>
                                <Button title="取消" onPress={() => setConfirmVisible(false)} />
                            </View>
                            <View style={{ flex:2 }}>
                                <Button
                                    title={submitting ? "提交中..." : `确认购买 ${formatAUD(p.price + shippingFee)}`}
                                    onPress={submitOrder}
                                    disabled={submitting}
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
