// src/pages/ReviewEditorPage.tsx
import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getOrder } from "../api/orders";
import { getProduct } from "../api/products";
import { createReview } from "../api/reviews";
import { RatingStars } from "../features/reviews/RatingStars";

export function ReviewEditorPage() {
    const { orderId = "" } = useParams<{ orderId: string }>();
    const nav = useNavigate();
    const [rating, setRating] = useState(5);
    const [content, setContent] = useState("");
    const [anonymous, setAnonymous] = useState(false);

    const orderQ = useQuery({ queryKey: ["order", orderId], queryFn: () => getOrder(orderId), enabled: !!orderId });
    const prodQ = useQuery({
        queryKey: ["product", orderQ.data?.productId],
        queryFn: () => getProduct(orderQ.data!.productId),
        enabled: !!orderQ.data?.productId,
        staleTime: 60_000,
    });

    const createM = useMutation({
        mutationFn: () =>
            createReview({
                orderId,
                rating,
                comment: content.trim(),
                isAnonymous: anonymous,
            }),
        onSuccess: () => {
            nav(`/reviews/success?orderId=${orderId}`);
        },
    });

    const order = orderQ.data;
    const productImage = prodQ.data?.images?.[0] || "https://placehold.co/120x120";
    const productTitle = prodQ.data?.title || `订单 ${orderId}`;
    const orderPrice = useMemo(() => {
        if (order?.priceSnapshot == null) return "";
        try {
            return new Intl.NumberFormat("zh-CN", {
                style: "currency",
                currency: order.currency || "CNY",
            }).format(order.priceSnapshot ?? 0);
        } catch {
            return `¥${order?.priceSnapshot ?? 0}`;
        }
    }, [order?.currency, order?.priceSnapshot]);
    const createdAtText = useMemo(() => (order?.createdAt ? new Date(order.createdAt).toLocaleString() : ""), [order?.createdAt]);
    const closedAtText = useMemo(() => (order?.closedAt ? new Date(order.closedAt).toLocaleString() : ""), [order?.closedAt]);

    if (orderQ.isLoading) {
        return <main className="max-w-3xl mx-auto p-6">加载中...</main>;
    }
    if (orderQ.isError || !order) {
        return <main className="max-w-3xl mx-auto p-6 text-red-600">订单不存在</main>;
    }

    const goBackToReviews = () => {
        nav("/me/center/reviews?tab=buyer");
    };

    return (
        <main className="max-w-3xl mx-auto p-6">
            <div className="card p-6 space-y-6">
                <div className="flex gap-4">
                    <img
                        src={productImage}
                        alt={productTitle}
                        className="w-24 h-24 rounded-lg object-cover border border-[var(--color-border)]"
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs tracking-wide text-[var(--color-secondary-700)]">评价商品</p>
                        <h1 className="text-lg font-semibold text-[var(--color-text-strong)] line-clamp-2">{productTitle}</h1>
                        <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-gray-500 sm:grid-cols-2">
                            <span>订单号：{orderId}</span>
                            {orderPrice && <span>订单金额：{orderPrice}</span>}
                            {createdAtText && <span>下单时间：{createdAtText}</span>}
                            {closedAtText && <span>完成时间：{closedAtText}</span>}
                        </div>
                    </div>
                </div>

                <div className="space-y-5">
                    <div className="flex flex-wrap items-center gap-4">
                        <span className="text-sm text-gray-600">评分</span>
                        <RatingStars value={rating} onChange={setRating} size={22} />
                        <span className="text-sm font-medium text-[var(--color-text-strong)]">{rating} 分</span>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-gray-600">评价内容</label>
                        <textarea
                            className="input text-sm min-h-[140px] resize-none"
                            placeholder="分享一下本次交易的体验吧～"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>

                    <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                        <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
                        匿名评价
                    </label>

                    <div className="flex flex-wrap justify-end gap-2">
                        <button type="button" onClick={goBackToReviews} className="btn btn-ghost text-sm">
                            稍后再写
                        </button>
                        <button
                            onClick={() => createM.mutate()}
                            disabled={createM.isPending}
                            className="btn btn-primary text-sm"
                        >
                            {createM.isPending ? "提交中..." : "提交评价"}
                        </button>
                    </div>

                    {createM.isError && (
                        <div className="text-sm text-red-600">提交失败：{(createM.error as Error).message}</div>
                    )}
                </div>
            </div>
        </main>
    );
}
