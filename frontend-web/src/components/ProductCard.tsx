import type { ProductRes } from "../api/types";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getUserBrief } from "../api/users";

// 商品卡片：点击跳转到 /product/:id
export function ProductCard({ p }: { p: ProductRes }) {
    const img = p.images?.[0] || "https://placehold.co/600x600?text=No+Image";
    return (
        <div className="card hover:shadow-[var(--shadow-2)] transition-all duration-300 overflow-hidden group">
            <Link
                to={`/product/${p.id}`}
                className="block"
                title={p.title}
                target="_blank"
                rel="noopener noreferrer"
            >
                <div className="relative aspect-square bg-[var(--color-muted)] overflow-hidden">
                    <img src={img} alt={p.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                    {/* 包邮标签 */}
                    {((p as any).freeShipping || (p as any).free_shipping) && (
                        <div className="absolute top-2 left-2">
                            <span className="chip chip-primary text-xs px-2 py-1">包邮</span>
                        </div>
                    )}
                    {/* 商品状态标签 */}
                    {p.status && p.status !== "ACTIVE" && (
                        <div className="absolute top-2 right-2">
                            <span className="chip chip-muted text-xs px-2 py-1">{mapStatus(p.status)}</span>
                        </div>
                    )}
                </div>
                <div className="p-4">
                    <div className="text-sm font-medium min-h-[2.8em] overflow-hidden leading-tight line-clamp-2">{p.title}</div>
                    <div className="mt-3 flex items-center justify-between">
                        <span className="font-bold text-lg text-[var(--color-text-strong)]">{formatPrice(p.price, p.currency)}</span>
                        <div className="flex items-center gap-2">
                            {((p as any).freeShipping || (p as any).free_shipping) && <span className="tag tag-success text-xs">包邮</span>}
                            {p.condition && <span className="chip chip-secondary text-xs">{mapCondition(p.condition)}</span>}
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
        <div className="mt-3 flex items-center gap-2 pt-2 border-t border-gray-100">
            <img src={u.avatarUrl || "https://placehold.co/24x24"} alt={u.displayName} className="w-6 h-6 rounded-full border border-[var(--color-border)]" />
            <span className="text-xs text-gray-600 truncate flex-1">{u.displayName}</span>
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
