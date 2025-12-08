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

    // Fetch reviews from both parties to see whether I have already reviewed
    const orderReviewsQ = useQuery({
        queryKey: ["orderReviews", id],
        queryFn: () => getOrderReviews(id!),
        enabled: !!id,
        staleTime: 60_000,
    });

    // Mutations
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

    if (orderQ.isLoading) return <main className="max-w-6xl mx-auto p-6">Loading...</main>;
    if (orderQ.isError || !orderQ.data) {
        return (
            <main className="max-w-6xl mx-auto p-6 text-red-600">
                Order does not exist.
            </main>
        );
    }

    const o = orderQ.data;
    const role = whoAmI({ buyerId: o.buyerId, sellerId: o.sellerId }, myId);
    const p = prodQ.data;
    const up = (o.status || "").toUpperCase();

    // Review CTA: show after order is completed (CONFIRMED/COMPLETED) and I have not reviewed yet
    const isDone = up === "CONFIRMED" || up === "COMPLETED";
    const myReviewed =
        !!myId &&
        (orderReviewsQ.data || []).some((rv) => String(rv.reviewer?.id) === String(myId));

    // Only show actions that are actually available
    const canPay = false; // Payment is handled by a separate page; no direct pay action here
    const canShip = can("ship", o.status, role as any);
    const canConfirm = can("confirm", o.status, role as any);
    const canCancel = can("cancel", o.status, role as any);
    const hasAnyAction = canPay || canShip || canConfirm || canCancel;

    return (
        <main className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header: order ID + status */}
            <div className="card p-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                    Order ID: <b>{o.id}</b>
                </div>
                <OrderStatusTag status={o.status} />
            </div>

            {/* PENDING status banner */}
            {up === "PENDING" && (
                <div className="tag-warning p-3 rounded-lg border border-[var(--warning)] bg-[var(--warning-bg)] text-[var(--warning)] text-sm">
                    {role === "buyer"
                        ? "This order has been reserved for you for 30 minutes. Please complete the payment as soon as possible."
                        : "The buyer is currently paying. You may cancel the order if something looks wrong."}
                </div>
            )}

            {/* Product snapshot */}
            <div className="card p-4 flex gap-4">
                <img
                    src={p?.images?.[0] || "https://placehold.co/120x120"}
                    className="w-28 h-28 rounded object-cover border border-[var(--color-border)]"
                />
                <div className="flex-1 min-w-0">
                    <div className="font-medium">{p?.title || `Item ${o.productId}`}</div>
                    <div className="text-sm text-gray-600 mt-1">Order price: ¥{o.priceSnapshot}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        Created at: {new Date(o.createdAt).toLocaleString()}
                    </div>
                    {o.closedAt && (
                        <div className="text-xs text-gray-500 mt-1">
                            Completed/closed at: {new Date(o.closedAt).toLocaleString()}
                        </div>
                    )}
                </div>
                <Link
                    to={`/product/${o.productId}`}
                    className="self-start btn btn-secondary text-sm"
                >
                    View item
                </Link>
            </div>

            {/* Timeline */}
            <div className="card p-4">
                <div className="text-sm text-gray-600 mb-2">Order timeline</div>
                <OrderTimeline status={o.status} />
            </div>

            {/* Review CTA: visible when order is completed but I have not reviewed yet */}
            {isDone && role !== "guest" && (
                <div className="card p-4 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        {myReviewed
                            ? "You have already left a review for this order."
                            : "Your transaction is complete. Share your experience with a review."}
                    </div>
                    {!myReviewed && (
                        <button
                            onClick={() => nav(`/reviews/new/${o.id}`)}
                            className="btn btn-primary"
                        >
                            Write a review
                        </button>
                    )}
                </div>
            )}

            {/* Actions bar: only visible when there are available actions */}
            {hasAnyAction && (
                <div className="card p-4">
                    <div className="text-sm text-gray-600 mb-3">Available actions</div>
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
                                {shipM.isPending ? "Shipping..." : "Ship item"}
                            </button>
                        )}

                        {canConfirm && (
                            <button
                                onClick={async () => {
                                    if (
                                        await confirm(
                                            "Confirm receipt",
                                            "Have you received the item? This action cannot be undone."
                                        )
                                    ) {
                                        confirmM.mutate();
                                    }
                                }}
                                disabled={confirmM.isPending}
                                className="btn btn-primary disabled:opacity-50"
                            >
                                {confirmM.isPending ? "Confirming..." : "Confirm receipt"}
                            </button>
                        )}

                        {canCancel && (
                            <button
                                onClick={async () => {
                                    if (await confirm("Cancel order", "Are you sure you want to cancel this order?")) {
                                        cancelM.mutate();
                                    }
                                }}
                                disabled={cancelM.isPending}
                                className="btn btn-secondary disabled:opacity-50"
                            >
                                {cancelM.isPending ? "Cancelling..." : "Cancel order"}
                            </button>
                        )}
                    </div>

                    {(shipM.isError || confirmM.isError || cancelM.isError) && (
                        <div className="text-sm text-red-600 mt-3">
                            {(shipM.error as Error)?.message ||
                                (confirmM.error as Error)?.message ||
                                (cancelM.error as Error)?.message ||
                                "Action failed"}
                        </div>
                    )}
                </div>
            )}

            {/* Back links */}
            <div className="flex gap-3">
                <button
                    onClick={() => nav(role === "seller" ? "/me/center/orders?role=seller" : "/me/center/orders?role=buyer")}
                    className="btn btn-primary text-sm"
                >
                    Back to my orders
                </button>
                <Link to="/" className="text-blue-600 underline">
                    Back to home
                </Link>
            </div>
        </main>
    );
}
