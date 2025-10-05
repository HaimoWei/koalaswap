import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listOrders, type OrderRes } from "../api/orders";
import { getProduct } from "../api/products";
import { OrderStatusTag } from "../components/OrderStatusTag";
import type { Page } from "../api/types";

// 状态选项
const STATUS_OPTIONS = [
    ["all", "全部"],
    ["PENDING", "待支付"],
    ["PAID", "已支付"],
    ["SHIPPED", "已发货"],
    ["CONFIRMED", "已收货"],
    ["CANCELLED", "已取消"],
] as const;

function OrderCard({ o }: { o: OrderRes }) {
    const { data: prod } = useQuery({
        queryKey: ["product", o.productId],
        queryFn: () => getProduct(o.productId),
        staleTime: 60_000,
    });
    const img = prod?.images?.[0] || "https://placehold.co/120x120?text=No+Image";

    return (
        <div className="card p-5 flex gap-4">
            <img src={img} className="w-24 h-24 rounded object-cover border border-[var(--color-border)]" />
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <Link to={`/orders/${o.id}`} className="font-medium hover:underline">
                        {prod?.title || `订单 ${o.id}`}
                    </Link>
                    <OrderStatusTag status={o.status} />
                </div>
                <div className="text-sm text-gray-600 mt-1">￥{o.priceSnapshot}</div>
                <div className="text-xs text-gray-500 mt-1">创建时间：{new Date(o.createdAt).toLocaleString()}</div>
            </div>
            <div className="flex flex-col items-end justify-between">
                <Link to={`/orders/${o.id}`} className="btn btn-primary text-sm">
                    查看详情
                </Link>
            </div>
        </div>
    );
}

export function OrdersListPage() {
    const [sp, setSp] = useSearchParams();
    const role = (sp.get("role") as "buyer" | "seller") || "buyer";
    const status = sp.get("status") || "all";
    const page = parseInt(sp.get("page") || "0", 10);
    const size = parseInt(sp.get("size") || "10", 10);

    const query = useQuery<Page<OrderRes>>({
        queryKey: ["orders", role, status, page, size],
        queryFn: () =>
            listOrders({
                role,
                status: status === "all" ? undefined : status,
                page,
                size,
                sort: "createdAt,desc",
            }),
        placeholderData: (prev) => prev as any,
    });

    const list: OrderRes[] = query.data?.content ?? [];
    const totalPages = query.data?.totalPages ?? 1;

    // 角色切换仅通过左侧导航，不在页面内提供切换按钮
    const setStatus = (s: string) => {
        const next = new URLSearchParams(sp);
        next.set("status", s);
        next.set("page", "0");
        setSp(next);
    };
    const setPage = (p: number) => {
        const next = new URLSearchParams(sp);
        next.set("page", String(p));
        setSp(next);
    };

    return (
        <main className="max-w-6xl mx-auto p-6 space-y-4">
            {/* 角色切换已移除：请通过左侧导航进入“我买到的/我卖出的” */}

            <div className="flex items-center gap-2 text-sm whitespace-nowrap">
                <span className="text-gray-600">状态：</span>
                <select className="input text-sm w-40 sm:w-44 md:w-56" value={status} onChange={(e) => setStatus(e.target.value)}>
                    {STATUS_OPTIONS.map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                    ))}
                </select>
            </div>

            {query.isLoading ? (
                <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-32 card animate-pulse" />)}</div>
            ) : query.isError ? (
                <div className="text-red-600">加载失败：{(query.error as Error)?.message}</div>
            ) : list.length === 0 ? (
                <div className="text-gray-600 text-sm">暂无订单</div>
            ) : (
                <div className="space-y-3">{list.map((o) => <OrderCard key={o.id} o={o} />)}</div>
            )}

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button className="btn btn-secondary" disabled={page <= 0} onClick={() => setPage(page - 1)}>上一页</button>
                    <span className="text-sm text-gray-600">第 {page + 1} / {totalPages} 页</span>
                    <button className="btn btn-secondary" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>下一页</button>
                </div>
            )}
        </main>
    );
}
