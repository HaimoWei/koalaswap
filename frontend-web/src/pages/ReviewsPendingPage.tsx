// src/pages/ReviewsPendingPage.tsx
import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getPendingReviews,
    getMyReviews,
    appendReview,
    type PendingItem,
    type PendingRes,
    type SellerReview as ReviewRes,
} from "../api/reviews";
import type { Page } from "../api/types";
import { RatingStars } from "../features/reviews/RatingStars";
import { AppendReviewDialog } from "../features/reviews/AppendReviewDialog";
import { useState } from "react";

// 直接按 tab 提取 buyer/seller 的待评列表
function normalizePending(
    res: PendingRes | undefined,
    tab: "buyer" | "seller" | "commented"
): PendingItem[] {
    if (!res) return [];
    if (tab === "buyer") return res.buyer || [];
    if (tab === "seller") return res.seller || [];
    return []; // commented 不在此返回，由 getMyReviews 提供
}

export function ReviewsPendingPage() {
    const [sp, setSp] = useSearchParams();
    const tab = (sp.get("tab") as "buyer" | "seller" | "commented") || "buyer";
    const page = parseInt(sp.get("page") || "0", 10);
    const size = parseInt(sp.get("size") || "20", 10);

    // 待评（买家/卖家）
    const pendingQ = useQuery<PendingRes>({
        queryKey: ["pendingReviews", tab, page, size],
        queryFn: () => getPendingReviews({ tab, page, size }),
        enabled: tab !== "commented", // “已评价”不打这个接口
        placeholderData: (prev) => prev as any,
    });

    // 已评价（我写过的首评）
    const givenQ = useQuery<Page<ReviewRes>>({
        queryKey: ["myReviews-for-commented", page, size],
        queryFn: () => getMyReviews({ page, size }),
        enabled: tab === "commented",
        placeholderData: (prev) => prev as any,
    });

    const listPending = normalizePending(pendingQ.data, tab);
    const listGiven = givenQ.data?.content ?? [];

    const loading = tab === "commented" ? givenQ.isLoading : pendingQ.isLoading;
    const error = tab === "commented" ? givenQ.isError : pendingQ.isError;
    const errObj = (tab === "commented" ? givenQ.error : pendingQ.error) as
        | Error
        | undefined;
    const empty =
        tab === "commented" ? listGiven.length === 0 : listPending.length === 0;

    const onTab = (t: "buyer" | "seller" | "commented") => {
        const next = new URLSearchParams(sp);
        next.set("tab", t);
        next.set("page", "0");
        setSp(next);
    };

    // —— 写追评弹窗 & 提交 ——
    const qc = useQueryClient();
    const [appendOpen, setAppendOpen] = useState(false);
    const [appendTarget, setAppendTarget] = useState<ReviewRes | null>(null);

    const appendM = useMutation<void, Error, string>({
        mutationFn: (content) => appendReview(appendTarget!.id, content),
        onSuccess: () => {
            setAppendOpen(false);
            setAppendTarget(null);
            // 刷新“已评价”tab的数据
            qc.invalidateQueries({ queryKey: ["myReviews-for-commented"] });
        },
    });

    return (
        <main className="max-w-6xl mx-auto p-6 space-y-4">
            <h1 className="text-xl font-semibold">我的评价</h1>

            <div className="flex gap-2">
                <button className={`btn text-sm ${tab === "buyer" ? "btn-primary" : "btn-secondary"}`} onClick={() => onTab("buyer")}>
                    买家待评
                </button>
                <button className={`btn text-sm ${tab === "seller" ? "btn-primary" : "btn-secondary"}`} onClick={() => onTab("seller")}>
                    卖家待评
                </button>
                <button className={`btn text-sm ${tab === "commented" ? "btn-primary" : "btn-secondary"}`} onClick={() => onTab("commented")}>已评价</button>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-20 card animate-pulse" />
                    ))}
                </div>
            ) : error ? (
                <div className="text-red-600">加载失败：{errObj?.message}</div>
            ) : empty ? (
                <div className="text-sm text-gray-600">暂无数据</div>
            ) : tab === "commented" ? (
                <div className="space-y-3">
                    {listGiven.map((r) => (
                        <GivenRow
                            key={r.id}
                            r={r}
                            onAppend={() => {
                                setAppendTarget(r);
                                setAppendOpen(true);
                            }}
                        />
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {listPending.map((it: PendingItem) => (
                        <PendingRow key={it.orderId} it={it} />
                    ))}
                </div>
            )}

            {/* 写追评弹窗 */}
            <AppendReviewDialog
                open={appendOpen}
                onClose={() => {
                    setAppendOpen(false);
                    setAppendTarget(null);
                }}
                onSubmit={(c) => appendM.mutateAsync(c)}
                loading={appendM.isPending}
            />
        </main>
    );
}

function PendingRow({ it }: { it: PendingItem }) {
    // ✅ 直接用后端 brief，不再二次拉 product
    const title = it.product?.title ?? "商品 -";
    const img =
        it.product?.firstImageUrl ||
        "https://placehold.co/120x120?text=No+Image";

    return (
        <div className="p-5 card flex items-center gap-4">
            <img src={img} className="w-24 h-24 rounded object-cover border border-[var(--color-border)]" />
            <div className="flex-1 min-w-0 self-start">
                {/* 第一行：商品名称 */}
                <div className="font-medium truncate">{title}</div>
                {/* 第二行：订单编号 */}
                <div className="text-xs text-gray-500 mt-1">订单：{it.orderId}</div>
            </div>
            <Link
                to={`/reviews/new/${it.orderId}`}
                className="btn btn-primary text-sm"
            >
                去评价
            </Link>
        </div>
    );
}

function GivenRow({ r, onAppend }: { r: ReviewRes; onAppend: () => void }) {
    // ✅ 直接用后端 brief，不再二次拉 product
    const title = r.product?.title ?? "商品 -";
    const img =
        r.product?.firstImageUrl ||
        "https://placehold.co/120x120?text=No+Image";

    return (
        <div className="p-5 card flex items-center gap-4">
            <img src={img} className="w-24 h-24 rounded object-cover border border-[var(--color-border)]" />
            <div className="flex-1 min-w-0 self-start">
                {/* 第一行：商品名称 */}
                <div className="font-medium truncate">{title}</div>
                {/* 第二行：订单编号 */}
                <div className="text-xs text-gray-500 mt-1">订单：{r.orderId}</div>

                <div className="flex items-center gap-2 mt-1">
                    <RatingStars value={r.rating} readOnly size={14} />
                    {r.createdAt && (
                        <span className="text-xs text-gray-600">
              {new Date(r.createdAt).toLocaleString()}
            </span>
                    )}
                </div>

                {!!r.comment && (
                    <div className="text-xs text-gray-700 mt-1 line-clamp-2">
                        {r.comment}
                    </div>
                )}
            </div>

            {/* 只保留【写追评】 */}
            <button
                onClick={onAppend}
                className="btn btn-secondary text-sm"
            >
                写追评
            </button>
        </div>
    );
}
