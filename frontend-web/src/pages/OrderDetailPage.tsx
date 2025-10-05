import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrder, shipOrder, confirmOrder, cancelOrder } from "../api/orders";
import { getProduct } from "../api/products";
import { getOrderReviews } from "../api/reviews";
import { OrderStatusTag } from "../components/OrderStatusTag";
import { confirm, toast } from "../store/overlay";
import { OrderTimeline } from "../components/OrderTimeline";
import { useAuthStore } from "../store/auth";

// 我是谁
function whoAmI(order: { buyerId: string; sellerId: string }, myId?: string) {
    if (!myId) return "guest";
    if (order.buyerId === myId) return "buyer";
    if (order.sellerId === myId) return "seller";
    return "guest";
}

// 权限：按后端规则
function can(
    action: "pay" | "ship" | "confirm" | "cancel",
    status: string,
    role: "buyer" | "seller" | "guest"
) {
    const s = (status || "").toUpperCase();
    if (s === "CANCELLED" || s === "CANCELED" || s === "COMPLETED") return false;
    if (action === "pay") return role === "buyer" && s === "PENDING";
    if (action === "ship") return role === "seller" && s === "PAID";
    if (action === "confirm") return role === "buyer" && s === "SHIPPED";
    if (action === "cancel") {
        if (role === "buyer") return s === "PENDING" || s === "PAID";
        if (role === "seller") return s === "PENDING";
        return false;
    }
    return false;
}

export function OrderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const nav = useNavigate();
    const qc = useQueryClient();
    const myId = useAuthStore((s) => s.profile?.id);

    const orderQ = useQuery({ queryKey: ["order", id], queryFn: () => getOrder(id!), enabled: !!id });
    const prodQ = useQuery({
        queryKey: ["product", orderQ.data?.productId],
        queryFn: () => getProduct(orderQ.data!.productId),
        enabled: !!orderQ.data?.productId,
        staleTime: 60_000,
    });

    // 查询该订单的双方评价，用来判断我是否已评价
    const orderReviewsQ = useQuery({
        queryKey: ["orderReviews", id],
        queryFn: () => getOrderReviews(id!),
        enabled: !!id,
        staleTime: 60_000,
    });

    // 动作
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

    if (orderQ.isLoading) return <main className="max-w-6xl mx-auto p-6">加载中...</main>;
    if (orderQ.isError || !orderQ.data) return <main className="max-w-6xl mx-auto p-6 text-red-600">订单不存在</main>;

    const o = orderQ.data;
    const role = whoAmI({ buyerId: o.buyerId, sellerId: o.sellerId }, myId);
    const p = prodQ.data;
    const up = (o.status || "").toUpperCase();

    // 评价 CTA：订单完成后（CONFIRMED/COMPLETED），且我还没评价
    const isDone = up === "CONFIRMED" || up === "COMPLETED";
    const myReviewed =
        !!myId &&
        (orderReviewsQ.data || []).some((rv) => String(rv.reviewer?.id) === String(myId));

    // 只显示可执行的按钮
    const canPay = false; // 支付在详情页用“去支付页”呈现；本页不直接调 pay
    const canShip = can("ship", o.status, role as any);
    const canConfirm = can("confirm", o.status, role as any);
    const canCancel = can("cancel", o.status, role as any);
    const hasAnyAction = canPay || canShip || canConfirm || canCancel;

    return (
        <main className="max-w-6xl mx-auto p-6 space-y-6">
            {/* 顶部：订单号 + 状态 */}
            <div className="card p-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                    订单号：<b>{o.id}</b>
                </div>
                <OrderStatusTag status={o.status} />
            </div>

            {/* PENDING 提示条（仿闲鱼） */}
            {up === "PENDING" && (
                <div className="tag-warning p-3 rounded-lg border border-[var(--warning)] bg-[var(--warning-bg)] text-[var(--warning)] text-sm">
                    {role === "buyer"
                        ? "订单已为你锁定 30 分钟，请尽快完成支付，否则可能被抢拍。"
                        : "买家正在支付，若异常可取消订单。"}
                </div>
            )}

            {/* 商品快照 */}
            <div className="card p-4 flex gap-4">
                <img
                    src={p?.images?.[0] || "https://placehold.co/120x120"}
                    className="w-28 h-28 rounded object-cover border border-[var(--color-border)]"
                />
                <div className="flex-1 min-w-0">
                    <div className="font-medium">{p?.title || `商品 ${o.productId}`}</div>
                    <div className="text-sm text-gray-600 mt-1">订单价格：￥{o.priceSnapshot}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        创建时间：{new Date(o.createdAt).toLocaleString()}
                    </div>
                    {o.closedAt && (
                        <div className="text-xs text-gray-500 mt-1">
                            完成/关闭：{new Date(o.closedAt).toLocaleString()}
                        </div>
                    )}
                </div>
                <Link
                    to={`/product/${o.productId}`}
                    className="self-start btn btn-secondary text-sm"
                >
                    查看商品
                </Link>
            </div>

            {/* 时间线 */}
            <div className="card p-4">
                <div className="text-sm text-gray-600 mb-2">订单进度</div>
                <OrderTimeline status={o.status} />
            </div>

            {/* 评价 CTA：已完成但我还没评时出现 */}
            {isDone && role !== "guest" && (
                <div className="card p-4 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        {myReviewed ? "你已完成该订单的评价。" : "交易已完成，写个评价分享一下体验吧～"}
                    </div>
                    {!myReviewed && (
                        <button
                            onClick={() => nav(`/reviews/new/${o.id}`)}
                            className="btn btn-primary"
                        >
                            去评价
                        </button>
                    )}
                </div>
            )}

            {/* 操作条：仅在有可操作项时显示 */}
            {hasAnyAction && (
                <div className="card p-4">
                    <div className="text-sm text-gray-600 mb-3">可执行操作</div>
                    <div className="flex flex-wrap gap-3">
                        {/* 去支付入口跳到支付页，这里不直接展示（如需展示可放开）
            {canPay && (
              <button onClick={() => nav(`/pay/${o.id}`)} className="px-4 py-2 rounded text-sm bg-blue-600 text-white">
                去支付
              </button>
            )} */}

                        {canShip && (
                            <button
                                onClick={() => shipM.mutate()}
                                disabled={shipM.isPending}
                                className="btn btn-secondary disabled:opacity-50"
                            >
                                {shipM.isPending ? "发货中..." : "发货"}
                            </button>
                        )}

                        {canConfirm && (
                            <button
                                onClick={async () => {
                                    if (await confirm("确认收货", "确认已收到商品？确认后将无法撤销")) {
                                        confirmM.mutate();
                                    }
                                }}
                                disabled={confirmM.isPending}
                                className="btn btn-primary disabled:opacity-50"
                            >
                                {confirmM.isPending ? "确认中..." : "确认收货"}
                            </button>
                        )}

                        {canCancel && (
                            <button
                                onClick={async () => { if (await confirm("取消订单", "确认要取消该订单？")) cancelM.mutate(); }}
                                disabled={cancelM.isPending}
                                className="btn btn-secondary disabled:opacity-50"
                            >
                                {cancelM.isPending ? "取消中..." : "取消订单"}
                            </button>
                        )}
                    </div>

                    {(shipM.isError || confirmM.isError || cancelM.isError) && (
                        <div className="text-sm text-red-600 mt-3">
                            {(shipM.error as Error)?.message ||
                                (confirmM.error as Error)?.message ||
                                (cancelM.error as Error)?.message ||
                                "操作失败"}
                        </div>
                    )}
                </div>
            )}

            {/* 返回 */}
            <div className="flex gap-3">
                <button
                    onClick={() => nav(role === "seller" ? "/me/center/orders?role=seller" : "/me/center/orders?role=buyer")}
                    className="btn btn-primary text-sm"
                >
                    返回我的订单
                </button>
                <Link to="/" className="text-blue-600 underline">
                    返回首页
                </Link>
            </div>
        </main>
    );
}
