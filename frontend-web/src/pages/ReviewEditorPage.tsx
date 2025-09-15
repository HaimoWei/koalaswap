// src/pages/ReviewEditorPage.tsx
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getOrder } from "../api/orders";
import { getProduct } from "../api/products";
import { createReview } from "../api/reviews";
import { useState } from "react";
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
                comment: content.trim(),     // ← 字段名改为 comment
                isAnonymous: anonymous,      // ← 字段名改为 isAnonymous
            }),
        onSuccess: () => {
            // 跳转到评价成功页面，带上订单ID参数
            nav(`/reviews/success?orderId=${orderId}`);
        },
    });

    if (orderQ.isLoading) return <main className="max-w-3xl mx-auto p-6">加载中...</main>;
    if (orderQ.isError || !orderQ.data) return <main className="max-w-3xl mx-auto p-6 text-red-600">订单不存在</main>;

    return (
        <main className="max-w-3xl mx-auto p-6 space-y-4">
            <div className="flex items-center gap-3">
                <img src={prodQ.data?.images?.[0] || "https://placehold.co/80x80"} className="w-16 h-16 rounded object-cover border" />
                <div className="text-sm">
                    <div className="font-medium">{prodQ.data?.title || `订单 ${orderId}`}</div>
                    <div className="text-gray-500">订单号：{orderId}</div>
                </div>
            </div>

            <div className="card p-4 space-y-4">
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">评分：</span>
                    <RatingStars value={rating} onChange={setRating} />
                    <span className="text-sm text-gray-600">{rating} 分</span>
                </div>

                <div>
                    <label className="block text-sm text-gray-600 mb-1">评价内容</label>
                    <textarea
                        className="w-full border rounded p-3 text-sm h-36"
                        placeholder="分享一下本次交易的体验吧～"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                </div>

                <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
                    匿名评价
                </label>

                <div className="flex gap-2 justify-end">
                    <Link to="/me/reviews/pending" className="btn btn-secondary text-sm">稍后再写</Link>
                    <button
                        onClick={() => createM.mutate()}
                        disabled={createM.isPending || !content.trim()}
                        className="px-3 py-2 rounded bg-black text-white text-sm disabled:opacity-50"
                    >
                        {createM.isPending ? "提交中..." : "提交评价"}
                    </button>
                </div>

                {createM.isError && (
                    <div className="text-sm text-red-600">提交失败：{(createM.error as Error).message}</div>
                )}
            </div>
        </main>
    );
}
