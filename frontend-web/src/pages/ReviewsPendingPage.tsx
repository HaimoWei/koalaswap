import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPendingReviews, type PendingItem, type PendingRes } from "../api/reviews";
import { getProduct } from "../api/products";

// 把 PendingRes 兼容成简单数组
function normalizePending(res: PendingRes): PendingItem[] {
    if (!res) return [];
    // Page<T>
    if ((res as any).content) return (res as any).content as PendingItem[];
    // {items:[]}
    if ((res as any).items) return (res as any).items as PendingItem[];
    return [];
}

export function ReviewsPendingPage() {
    const [sp, setSp] = useSearchParams();
    const tab = (sp.get("tab") as "buyer" | "seller" | "commented") || "buyer";
    const page = parseInt(sp.get("page") || "0", 10);
    const size = parseInt(sp.get("size") || "20", 10);

    // v5：加泛型 PendingRes；用 placeholderData 代替 keepPreviousData
    const q = useQuery<PendingRes>({
        queryKey: ["pendingReviews", tab, page, size],
        queryFn: () => getPendingReviews({ tab, page, size }),
        placeholderData: (prev) => prev as any,
    });

    const list = normalizePending(q.data as PendingRes);

    const onTab = (t: "buyer" | "seller" | "commented") => {
        const next = new URLSearchParams(sp);
        next.set("tab", t);
        next.set("page", "0");
        setSp(next);
    };

    return (
        <main className="max-w-6xl mx-auto p-6 space-y-4">
            <h1 className="text-xl font-semibold">待评价</h1>

            <div className="flex gap-2">
                <button
                    className={`px-3 py-1 rounded text-sm ${tab === "buyer" ? "bg-black text-white" : "bg-gray-100"}`}
                    onClick={() => onTab("buyer")}
                >
                    买家待评
                </button>
                <button
                    className={`px-3 py-1 rounded text-sm ${tab === "seller" ? "bg-black text-white" : "bg-gray-100"}`}
                    onClick={() => onTab("seller")}
                >
                    卖家待评
                </button>
                <button
                    className={`px-3 py-1 rounded text-sm ${tab === "commented" ? "bg-black text-white" : "bg-gray-100"}`}
                    onClick={() => onTab("commented")}
                >
                    已评价
                </button>
            </div>

            {q.isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-20 bg-white border rounded animate-pulse" />
                    ))}
                </div>
            ) : q.isError ? (
                <div className="text-red-600">加载失败：{(q.error as Error).message}</div>
            ) : list.length === 0 ? (
                <div className="text-sm text-gray-600">暂无数据</div>
            ) : (
                <div className="space-y-3">
                    {list.map((it: PendingItem) => (
                        <PendingRow key={it.orderId} it={it} />
                    ))}
                </div>
            )}

            {/* 简易分页（如果后端返回了 totalPages，可根据 q.data 判断；此处略） */}
        </main>
    );
}

function PendingRow({ it }: { it: PendingItem }) {
    // 二次获取商品，显示标题/封面（有缓存）
    const prodQ = useQuery({
        queryKey: ["product", it.productId],
        queryFn: () => getProduct(it.productId!),
        enabled: !!it.productId,
        staleTime: 60_000,
    });
    const img = prodQ.data?.images?.[0] || it.image || "https://placehold.co/120x120?text=No+Image";
    const title = prodQ.data?.title || it.title || `订单 ${it.orderId}`;

    return (
        <div className="p-3 border rounded-lg bg-white flex items-center gap-3">
            <img src={img} className="w-20 h-20 rounded object-cover border" />
            <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{title}</div>
                <div className="text-xs text-gray-500 mt-1">订单：{it.orderId}</div>
            </div>
            {/* 已评价 tab 只展示查看按钮 */}
            <Link to={`/reviews/new/${it.orderId}`} className="px-3 py-1 rounded text-sm bg-black text-white hover:opacity-90">
                去评价
            </Link>
        </div>
    );
}
