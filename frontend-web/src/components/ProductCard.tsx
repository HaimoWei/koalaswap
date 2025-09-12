import type { ProductRes } from "../api/types";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getUserBrief } from "../api/users";

// 商品卡片：点击跳转到 /product/:id
export function ProductCard({ p }: { p: ProductRes }) {
    const img = p.images?.[0] || "https://placehold.co/600x600?text=No+Image";
    return (
        <div className="card hover:shadow-[var(--shadow-2)] transition overflow-hidden group">
            <Link to={`/product/${p.id}`} className="block" title={p.title}>
                <div className="relative aspect-square bg-[var(--color-muted)] overflow-hidden">
                    <img src={img} alt={p.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" loading="lazy" />
                </div>
                <div className="p-3">
                    <div className="text-sm min-h-[2.6em] overflow-hidden">{p.title}</div>
                    <div className="mt-2 flex items-center justify-between">
                        <span className="font-semibold text-[var(--color-text-strong)]">{formatPrice(p.price, p.currency)}</span>
                        <div className="flex gap-1">
                            {p.condition && <span className="chip chip-secondary">{mapCondition(p.condition)}</span>}
                            {p.status && p.status !== "ACTIVE" && <span className="chip chip-muted">{mapStatus(p.status)}</span>}
                        </div>
                    </div>
                    {/* 卖家头像与昵称 */}
                    {p.sellerId && <SellerBriefRow sellerId={String(p.sellerId)} />}
                </div>
            </Link>
        </div>
    );
}

function SellerBriefRow({ sellerId }: { sellerId: string }) {
    const q = useQuery({ queryKey: ["userBrief", sellerId], queryFn: () => getUserBrief(sellerId), staleTime: 60_000 });
    if (q.isLoading || q.isError || !q.data) return null;
    const u = q.data;
    return (
        <div className="mt-2 flex items-center gap-2">
            <img src={u.avatarUrl || "https://placehold.co/20x20"} alt={u.displayName} className="w-5 h-5 rounded-full border border-[var(--color-border)]" />
            <span className="text-xs text-gray-700">{u.displayName}</span>
        </div>
    );
}

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
