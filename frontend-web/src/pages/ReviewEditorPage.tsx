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
    const productTitle = prodQ.data?.title || `Order ${orderId}`;
    const orderPrice = useMemo(() => {
        if (order?.priceSnapshot == null) return "";
        try {
            return new Intl.NumberFormat("en-AU", {
                style: "currency",
                currency: order.currency || "AUD",
            }).format(order.priceSnapshot ?? 0);
        } catch {
            return `$${order?.priceSnapshot ?? 0}`;
        }
    }, [order?.currency, order?.priceSnapshot]);
    const createdAtText = useMemo(() => (order?.createdAt ? new Date(order.createdAt).toLocaleString() : ""), [order?.createdAt]);
    const closedAtText = useMemo(() => (order?.closedAt ? new Date(order.closedAt).toLocaleString() : ""), [order?.closedAt]);

    if (orderQ.isLoading) {
        return <main className="max-w-3xl mx-auto p-6">Loading...</main>;
    }
    if (orderQ.isError || !order) {
        return (
            <main className="max-w-3xl mx-auto p-6 text-red-600">
                Order does not exist.
            </main>
        );
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
                        <p className="text-xs tracking-wide text-[var(--color-secondary-700)]">Review item</p>
                        <h1 className="text-lg font-semibold text-[var(--color-text-strong)] line-clamp-2">{productTitle}</h1>
                        <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-gray-500 sm:grid-cols-2">
                            <span>Order ID: {orderId}</span>
                            {orderPrice && <span>Order amount: {orderPrice}</span>}
                            {createdAtText && <span>Order created at: {createdAtText}</span>}
                            {closedAtText && <span>Completed at: {closedAtText}</span>}
                        </div>
                    </div>
                </div>

                <div className="space-y-5">
                    <div className="flex flex-wrap items-center gap-4">
                        <span className="text-sm text-gray-600">Rating</span>
                        <RatingStars value={rating} onChange={setRating} size={22} />
                        <span className="text-sm font-medium text-[var(--color-text-strong)]">{rating} / 5</span>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-gray-600">Review content</label>
                        <textarea
                            className="input text-sm min-h-[140px] resize-none"
                            placeholder="Share your experience with this transaction."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>

                    <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                        <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
                        Post review anonymously
                    </label>

                    <div className="flex flex-wrap justify-end gap-2">
                        <button type="button" onClick={goBackToReviews} className="btn btn-ghost text-sm">
                            Write later
                        </button>
                        <button
                            onClick={() => createM.mutate()}
                            disabled={createM.isPending}
                            className="btn btn-primary text-sm"
                        >
                            {createM.isPending ? "Submitting..." : "Submit review"}
                        </button>
                    </div>

                    {createM.isError && (
                        <div className="text-sm text-red-600">
                            Failed to submit: {(createM.error as Error).message}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
