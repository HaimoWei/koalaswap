import type { ProductRes } from "../api/types";
import { Link } from "react-router-dom";

// 商品卡片：点击跳转到 /product/:id
export function ProductCard({ p }: { p: ProductRes }) {
    const img = p.images?.[0] || "https://placehold.co/600x600?text=No+Image";
    return (
        <div className="rounded-lg border bg-white hover:shadow-sm transition overflow-hidden">
            <Link to={`/product/${p.id}`} className="block" title={p.title}>
                <div className="aspect-square bg-gray-100">
                    <img src={img} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-3">
                    <div className="text-sm min-h-[2.6em] overflow-hidden">{p.title}</div>
                    <div className="mt-2 flex items-center justify-between">
                        <span className="font-semibold">{formatPrice(p.price, p.currency)}</span>
                        <div className="flex gap-1">
                            {p.condition && <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{mapCondition(p.condition)}</span>}
                            {p.status && p.status !== "ACTIVE" && <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{mapStatus(p.status)}</span>}
                        </div>
                    </div>
                </div>
            </Link>
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
