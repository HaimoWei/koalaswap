import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listOrders, type OrderRes } from "../api/orders";
import { getProduct } from "../api/products";
import { OrderStatusTag } from "../components/OrderStatusTag";
import type { Page } from "../api/types";

// 状态选项常量，写成 const 让类型更稳定
const STATUS_OPTIONS = [
    ["all", "全部"],
    ["CREATED", "待支付"],
    ["PAID", "已支付"],
    ["SHIPPED", "已发货"],
    ["CONFIRMED", "已收货"],
    ["CANCELLED", "已取消"],
] as const;

// 单个订单卡片，内部二次拉商品信息（有缓存，不怕 N+1）
function OrderCard({ o }: { o: OrderRes }) {
    const { data: prod } = useQuery({
        queryKey: ["product", o.productId],
        queryFn: () => getProduct(o.productId),
        staleTime: 60_000,
    });
    const img = prod?.images?.[0] || "https://placehold.co/120x120?text=No+Image";

    return (
        <div className="p-3 border rounded-lg bg-white flex gap-3">
            <img src={img} className="w-24 h-24 rounded object-cover border" />
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <Link to={`/orders/${o.id}`} className="font-medium hover:underline">
                        {prod?.title || `订单 ${o.id}`}
                    </Link>
                    <OrderStatusTag status={o.status} />
                </div>
                <div className="text-sm text-gray-600 mt-1">￥{o.priceSnapshot}</div>
                <div className="text-xs text-gray-500 mt-1">
                    创建时间：{new Date(o.createdAt).toLocaleString()}
                </div>
            </div>
            <div className="flex flex-col items-end justify-between">
                <Link to={`/orders/${o.id}`} className="px-3 py-1 rounded text-sm bg-gray-100 hover:bg-gray-200">
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

    // v5：加泛型 Page<OrderRes>；用 placeholderData 代替 keepPreviousData
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

    const setRole = (r: "buyer" | "seller") => {
        const next = new URLSearchParams(sp);
        next.set("role", r);
        next.set("page", "0");
        setSp(next);
    };
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
            {/* 角色切换 */}
            <div className="flex gap-2">
                <button
                    className={`px-3 py-1 rounded text-sm ${
                        role === "buyer" ? "bg-black text-white" : "bg-gray-100"
                    }`}
                    onClick={() => setRole("buyer")}
                >
                    我买到的
                </button>
                <button
                    className={`px-3 py-1 rounded text-sm ${
                        role === "seller" ? "bg-black text-white" : "bg-gray-100"
                    }`}
                    onClick={() => setRole("seller")}
                >
                    我卖出的
                </button>
            </div>

            {/* 状态筛选 */}
            <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">状态：</span>
                <select
                    className="border rounded px-2 py-1"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                >
                    {STATUS_OPTIONS.map(([v, l]) => (
                        <option key={v} value={v}>
                            {l}
                        </option>
                    ))}
                </select>
            </div>

            {/* 列表 */}
            {query.isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-28 bg-white border rounded-lg animate-pulse" />
                    ))}
                </div>
            ) : query.isError ? (
                <div className="text-red-600">加载失败：{(query.error as Error)?.message}</div>
            ) : list.length === 0 ? (
                <div className="text-gray-600 text-sm">暂无订单</div>
            ) : (
                <div className="space-y-3">
                    {list.map((o: OrderRes) => (
                        <OrderCard key={o.id} o={o} />
                    ))}
                </div>
            )}

            {/* 分页 */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
                        disabled={page <= 0}
                        onClick={() => setPage(page - 1)}
                    >
                        上一页
                    </button>
                    <span className="text-sm text-gray-600">
            第 {page + 1} / {totalPages} 页
          </span>
                    <button
                        className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
                        disabled={page >= totalPages - 1}
                        onClick={() => setPage(page + 1)}
                    >
                        下一页
                    </button>
                </div>
            )}
        </main>
    );
}
