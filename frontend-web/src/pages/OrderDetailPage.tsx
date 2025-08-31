import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrder, payOrder, shipOrder, confirmOrder, cancelOrder } from "../api/orders";
import { getProduct } from "../api/products";
import { OrderStatusTag } from "../components/OrderStatusTag";
import { OrderTimeline } from "../components/OrderTimeline";
import { useAuthStore } from "../store/auth";

// 工具：根据当前登录用户角色推断“我是买家还是卖家”
function whoAmI(order: { buyerId: string; sellerId: string }, myId?: string) {
    if (!myId) return "guest";
    if (order.buyerId === myId) return "buyer";
    if (order.sellerId === myId) return "seller";
    return "guest";
}

// 简单可用性判断（后端会做强校验，这里只是前端提示）
function can(action: "pay"|"ship"|"confirm"|"cancel", status: string, role: "buyer"|"seller"|"guest") {
    const s = (status || "").toUpperCase();
    if (s === "CANCELLED" || s === "CANCELED" || s === "CONFIRMED" || s === "COMPLETED") return false;
    if (action === "pay")     return role === "buyer"  && (s === "CREATED" || s === "NEW");
    if (action === "ship")    return role === "seller" && (s === "PAID");
    if (action === "confirm") return role === "buyer"  && (s === "SHIPPED" || s === "PAID"); // 宽松：允许已支付后确认（以防状态名差异）
    if (action === "cancel")  return role !== "guest"  && (s === "CREATED" || s === "NEW" || s === "PAID");
    return false;
}

export function OrderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const qc = useQueryClient();
    const myId = useAuthStore((s) => s.profile?.id);

    const orderQ = useQuery({
        queryKey: ["order", id],
        queryFn: () => getOrder(id!),
        enabled: !!id,
    });

    const prodQ = useQuery({
        queryKey: ["product", orderQ.data?.productId],
        queryFn: () => getProduct(orderQ.data!.productId),
        enabled: !!orderQ.data?.productId,
        staleTime: 60_000,
    });

    // 动作 mutation
    const payM = useMutation({
        mutationFn: () => payOrder(id!),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["order", id] }),
    });
    const shipM = useMutation({
        mutationFn: () => shipOrder(id!),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["order", id] }),
    });
    const confirmM = useMutation({
        mutationFn: () => confirmOrder(id!),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["order", id] }),
    });
    const cancelM = useMutation({
        mutationFn: () => cancelOrder(id!),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["order", id] }),
    });

    if (orderQ.isLoading) {
        return <main className="max-w-6xl mx-auto p-6">加载中...</main>;
    }
    if (orderQ.isError || !orderQ.data) {
        return <main className="max-w-6xl mx-auto p-6 text-red-600">订单不存在</main>;
    }

    const o = orderQ.data;
    const role = whoAmI({ buyerId: o.buyerId, sellerId: o.sellerId }, myId);
    const p = prodQ.data;

    return (
        <main className="max-w-6xl mx-auto p-6 space-y-6">
            {/* 顶部：订单号 + 状态 */}
            <div className="bg-white border rounded-lg p-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                    订单号：<b>{o.id}</b>
                </div>
                <OrderStatusTag status={o.status} />
            </div>

            {/* 商品快照 */}
            <div className="bg-white border rounded-lg p-4 flex gap-4">
                <img
                    src={p?.images?.[0] || "https://placehold.co/120x120"}
                    className="w-28 h-28 rounded object-cover border"
                />
                <div className="flex-1 min-w-0">
                    <div className="font-medium">{p?.title || `商品 ${o.productId}`}</div>
                    <div className="text-sm text-gray-600 mt-1">订单价格：￥{o.priceSnapshot}</div>
                    <div className="text-xs text-gray-500 mt-1">创建时间：{new Date(o.createdAt).toLocaleString()}</div>
                    {o.closedAt && (
                        <div className="text-xs text-gray-500 mt-1">完成/关闭：{new Date(o.closedAt).toLocaleString()}</div>
                    )}
                </div>
                <Link to={`/product/${o.productId}`} className="self-start text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">
                    查看商品
                </Link>
            </div>

            {/* 时间线 */}
            <div className="bg-white border rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">订单进度</div>
                <OrderTimeline status={o.status} />
            </div>

            {/* 操作条：根据角色和状态显示 */}
            <div className="bg-white border rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-3">可执行操作（根据你的角色/状态变化）</div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => payM.mutate()}
                        disabled={!can("pay", o.status, role as any) || payM.isPending}
                        className="px-4 py-2 rounded text-sm bg-blue-600 text-white disabled:opacity-50"
                    >
                        {payM.isPending ? "支付中..." : "支付"}
                    </button>
                    <button
                        onClick={() => shipM.mutate()}
                        disabled={!can("ship", o.status, role as any) || shipM.isPending}
                        className="px-4 py-2 rounded text-sm bg-purple-600 text-white disabled:opacity-50"
                    >
                        {shipM.isPending ? "发货中..." : "发货"}
                    </button>
                    <button
                        onClick={() => confirmM.mutate()}
                        disabled={!can("confirm", o.status, role as any) || confirmM.isPending}
                        className="px-4 py-2 rounded text-sm bg-green-600 text-white disabled:opacity-50"
                    >
                        {confirmM.isPending ? "确认中..." : "确认收货"}
                    </button>
                    <button
                        onClick={() => confirm("确认要取消该订单？") && cancelM.mutate()}
                        disabled={!can("cancel", o.status, role as any) || cancelM.isPending}
                        className="px-4 py-2 rounded text-sm bg-gray-200 text-gray-800 disabled:opacity-50"
                    >
                        {cancelM.isPending ? "取消中..." : "取消订单"}
                    </button>
                </div>
                {/* 操作结果错误提示（如有） */}
                {(payM.isError || shipM.isError || confirmM.isError || cancelM.isError) && (
                    <div className="text-sm text-red-600 mt-3">
                        {(payM.error as Error)?.message ||
                            (shipM.error as Error)?.message ||
                            (confirmM.error as Error)?.message ||
                            (cancelM.error as Error)?.message ||
                            "操作失败"}
                    </div>
                )}
            </div>

            {/* 返回链接 */}
            <div className="flex gap-3">
                <Link to={`/orders?role=${role === "seller" ? "seller" : "buyer"}`} className="text-blue-600 underline">
                    返回订单列表
                </Link>
                <Link to="/" className="text-blue-600 underline">返回首页</Link>
            </div>
        </main>
    );
}
