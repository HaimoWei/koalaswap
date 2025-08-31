import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyReviews, appendReview, type ReviewRes } from "../api/reviews";
import { getProduct } from "../api/products";
import { RatingStars } from "../features/reviews/RatingStars";
import { useState } from "react";
import { AppendReviewDialog } from "../features/reviews/AppendReviewDialog";
import type { Page } from "../api/types"; // ★ 明确 Page<T> 类型

function ReviewItem({ r, onAppend }: { r: ReviewRes; onAppend: (r: ReviewRes) => void }) {
    const prodQ = useQuery({
        queryKey: ["product", r.productId],
        queryFn: () => getProduct(r.productId),
        staleTime: 60_000,
    });
    const img = prodQ.data?.images?.[0] || "https://placehold.co/120x120";
    const title = prodQ.data?.title || `商品 ${r.productId}`;

    return (
        <div className="p-3 border rounded-lg bg-white">
            <div className="flex gap-3">
                <img src={img} className="w-20 h-20 rounded object-cover border" />
                <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">订单：{r.orderId}</div>
                    <div className="flex items-center gap-2 mt-2">
                        <RatingStars value={r.rating} readOnly size={16} />
                        <span className="text-xs text-gray-600">{new Date(r.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-sm mt-2 whitespace-pre-wrap">{r.content}</div>

                    {/* 追评列表 */}
                    {r.appends?.length ? (
                        <div className="mt-3 space-y-2">
                            {r.appends.map((a) => (
                                <div key={a.id} className="text-sm bg-gray-50 border rounded p-2">
                                    <div className="text-xs text-gray-500 mb-1">
                                        {new Date(a.createdAt).toLocaleString()} 的追评
                                    </div>
                                    <div className="whitespace-pre-wrap">{a.content}</div>
                                </div>
                            ))}
                        </div>
                    ) : null}

                    <div className="mt-3">
                        <button
                            onClick={() => onAppend(r)}
                            className="px-3 py-1 rounded text-sm bg-gray-100 hover:bg-gray-200"
                        >
                            写追评
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function MyReviewsPage() {
    const [sp, setSp] = useSearchParams();
    const page = parseInt(sp.get("page") || "0", 10);
    const size = parseInt(sp.get("size") || "10", 10);

    const qc = useQueryClient();

    // ★ v5：加上泛型 Page<ReviewRes>；去掉 keepPreviousData，改用 placeholderData
    const q = useQuery<Page<ReviewRes>>({
        queryKey: ["myReviews", page, size],
        queryFn: () => getMyReviews({ page, size }),
        placeholderData: (prev) => prev as any,
    });

    // 追评弹窗控制
    const [open, setOpen] = useState(false);
    const [target, setTarget] = useState<ReviewRes | null>(null);

    // ★ v5：给 useMutation 明确泛型；状态用 isPending（不是 isLoading）
    const appendM = useMutation<ReviewRes, Error, string>({
        mutationFn: (content) => appendReview(target!.id, content),
        onSuccess: () => {
            setOpen(false);
            setTarget(null);
            qc.invalidateQueries({ queryKey: ["myReviews"] });
        },
    });

    const onPage = (p: number) => {
        const next = new URLSearchParams(sp);
        next.set("page", String(p));
        setSp(next);
    };

    const list = q.data?.content ?? [];
    const totalPages = q.data?.totalPages ?? 1;

    return (
        <main className="max-w-6xl mx-auto p-6 space-y-4">
            <h1 className="text-xl font-semibold">我写过的评价</h1>

            {q.isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-28 bg-white border rounded animate-pulse" />
                    ))}
                </div>
            ) : q.isError ? (
                <div className="text-red-600">加载失败：{(q.error as Error).message}</div>
            ) : list.length === 0 ? (
                <div className="text-sm text-gray-600">暂无评价</div>
            ) : (
                <>
                    <div className="space-y-3">
                        {list.map((r) => (
                            <ReviewItem
                                key={r.id}
                                r={r}
                                onAppend={(rv) => {
                                    setTarget(rv);
                                    setOpen(true);
                                }}
                            />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2">
                            <button
                                className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
                                disabled={page <= 0}
                                onClick={() => onPage(page - 1)}
                            >
                                上一页
                            </button>
                            <span className="text-sm text-gray-600">
                第 {page + 1} / {totalPages} 页
              </span>
                            <button
                                className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
                                disabled={page >= totalPages - 1}
                                onClick={() => onPage(page + 1)}
                            >
                                下一页
                            </button>
                        </div>
                    )}
                </>
            )}

            <AppendReviewDialog
                open={open}
                onClose={() => {
                    setOpen(false);
                    setTarget(null);
                }}
                // ★ v5：mutateAsync 仍可用；也可用 mutate(c, { onSuccess })，这里保留 async 用法
                onSubmit={async (c) => {
                    await appendM.mutateAsync(c); // 这里不返回结果，函数返回 Promise<void>
                }}
                loading={appendM.isPending} // ★ v5 用 isPending
            />
        </main>
    );
}
