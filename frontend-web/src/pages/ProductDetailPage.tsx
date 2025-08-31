import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getProduct } from "../api/products";
import { getUserBrief } from "../api/users";
import { useAuthStore } from "../store/auth";
import { useUiStore } from "../store/ui";
import { createConversation } from "../api/chat";
import { createOrder } from "../api/orders";
import { FavoriteButton } from "../features/products/FavoriteButton";
import { useState } from "react";

export function ProductDetailPage() {
    const { id = "" } = useParams<{ id: string }>();
    const nav = useNavigate();
    const { profile, token } = useAuthStore();
    const openAuth = useUiStore((s) => s.openAuth);

    const productQ = useQuery({
        queryKey: ["product", id],
        queryFn: () => getProduct(id),
        enabled: !!id,
    });

    const sellerQ = useQuery({
        queryKey: ["sellerBrief", productQ.data?.sellerId],
        queryFn: () => getUserBrief(productQ.data!.sellerId),
        enabled: !!productQ.data?.sellerId,
    });

    if (productQ.isLoading) {
        return <main className="max-w-6xl mx-auto p-6">加载中...</main>;
    }
    if (productQ.isError || !productQ.data) {
        return <main className="max-w-6xl mx-auto p-6 text-red-600">商品不存在或已下架</main>;
    }

    const p = productQ.data;
    const isMine = profile?.id === p.sellerId;
    const disabledBuy = isMine || p.status === "SOLD" || p.status === "HIDDEN";
    const disabledChat = isMine || p.status === "HIDDEN";

    async function onChat() {
        if (!token) return openAuth();
        try {
            const conv = await createConversation({ productId: p.id, sellerId: p.sellerId });
            nav(`/chat/${conv.id}`); // 阶段 5 再实现聊天详情
        } catch (e: any) {
            alert(e?.message || "发起聊天失败");
        }
    }

    async function onOrder() {
        if (!token) return openAuth();
        try {
            const order = await createOrder(p.id);
            nav(`/orders/${order.id}`); // 阶段 4 再实现订单详情
        } catch (e: any) {
            alert(e?.message || "下单失败");
        }
    }

    return (
        <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 左：图片轮播（简单版：大图 + 缩略图列表） */}
            <div>
                <Gallery images={p.images} />
            </div>

            {/* 右：标题、价格、操作、卖家卡片 */}
            <div>
                <h1 className="text-xl font-semibold">{p.title}</h1>
                <div className="mt-2 text-2xl font-bold">{formatPrice(p.price, p.currency)}</div>

                {/* 状态标签 */}
                <div className="mt-2 flex gap-2">
                    {p.condition && <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{mapCondition(p.condition)}</span>}
                    {p.status && p.status !== "ACTIVE" && <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{mapStatus(p.status)}</span>}
                </div>

                {/* 操作按钮 */}
                <div className="mt-4 flex gap-3">
                    <button
                        onClick={onChat}
                        disabled={disabledChat}
                        className="px-4 py-2 rounded bg-black text-white text-sm disabled:opacity-50"
                    >
                        聊一聊
                    </button>
                    <button
                        onClick={onOrder}
                        disabled={disabledBuy}
                        className="px-4 py-2 rounded bg-orange-500 text-white text-sm disabled:opacity-50"
                    >
                        我想要
                    </button>

                    <FavoriteButton productId={p.id} />
                </div>

                {/* 卖家名片 */}
                <div className="mt-6 border rounded-lg bg-white p-4">
                    <div className="text-sm text-gray-500 mb-2">卖家</div>
                    {sellerQ.isLoading ? (
                        <div className="h-12 bg-gray-100 rounded" />
                    ) : sellerQ.data ? (
                        <div className="flex items-center gap-3">
                            <img
                                src={sellerQ.data.avatarUrl || "https://placehold.co/40x40"}
                                className="w-10 h-10 rounded-full border"
                            />
                            <div className="text-sm">{sellerQ.data.displayName}</div>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500">卖家信息不可用</div>
                    )}
                </div>

                {/* 描述 */}
                {p.description && (
                    <div className="mt-6 border rounded-lg bg-white p-4">
                        <div className="text-sm text-gray-500 mb-2">描述</div>
                        <p className="text-sm leading-relaxed whitespace-pre-line">{p.description}</p>
                    </div>
                )}
            </div>
        </main>
    );
}

function Gallery({ images }: { images: string[] }) {
    const list = images?.length ? images : ["https://placehold.co/800x800?text=No+Image"];
    const [idx, setIdx] = useState(0);

    return (
        <div>
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img src={list[Math.min(idx, list.length - 1)]} className="w-full h-full object-cover" />
            </div>
            <div className="mt-3 grid grid-cols-5 gap-2">
                {list.map((url, i) => (
                    <button
                        key={i}
                        onClick={() => setIdx(i)}
                        className={`aspect-square rounded border overflow-hidden ${i === idx ? "ring-2 ring-black" : ""}`}
                    >
                        <img src={url} className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>
        </div>
    );
}

// 与卡片相同的本地化函数
function formatPrice(n: number, c?: string | null) {
    try { if (c === "AUD" || c === "CNY") return new Intl.NumberFormat("zh-CN", { style: "currency", currency: c }).format(n); } catch {}
    return `¥${n}`;
}
function mapCondition(c: string) {
    const m: Record<string, string> = { NEW: "全新", LIKE_NEW: "九成新", GOOD: "良好", FAIR: "一般" };
    return m[c] || c;
}
function mapStatus(s: string) {
    const m: Record<string, string> = { ACTIVE: "在售", RESERVED: "已预定", SOLD: "已售出", HIDDEN: "隐藏" };
    return m[s] || s;
}
