// src/pages/SellerProfilePage.tsx
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getUserPublic } from "../api/users";
import { listSellerActive } from "../api/products";
import { listUserReviews, type SellerReview } from "../api/reviews";

const AVATAR_FALLBACK_40 = "https://placehold.co/40x40?text=%20";
const AVATAR_FALLBACK_64 = "https://placehold.co/64x64?text=%20";

/** 将第三方图片切到公共代理，解决 521/跨域/防盗链等问题 */
function proxyImg(url: string, size: number) {
    // images.weserv.nl 要求去掉协议
    const noProto = url.replace(/^https?:\/\//i, "");
    // fit=cover 保证等比裁剪为正方形
    return `https://images.weserv.nl/?url=${encodeURIComponent(noProto)}&w=${size}&h=${size}&fit=cover`;
}

/** 统一头像组件：先尝试原图，失败→代理，再失败→占位图 */
function Avatar({
                    url,
                    name,
                    size = 36,
                    fallback,
                    className = "",
                }: {
    url?: string | null;
    name?: string | null;
    size?: number;
    fallback?: string;
    className?: string;
}) {
    const fb = fallback || `https://placehold.co/${size}x${size}?text=%20`;
    const alt = name ? `${name} 的头像` : "用户头像";

    return (
        <img
            src={url || fb}
            alt={alt}
            width={size}
            height={size}
            className={`rounded-full border object-cover ${className}`}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            // ⚠️ 不要加 crossOrigin，避免把普通 <img> 变成 CORS 模式
            onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                const tried = img.getAttribute("data-tried") || "";
                // 第一次失败：如果有原始 url，尝试代理
                if (url && tried !== "proxy") {
                    img.setAttribute("data-tried", "proxy");
                    img.src = proxyImg(url, size);
                    return;
                }
                // 第二次失败：回落到占位图
                if (img.src !== fb) {
                    img.onerror = null;
                    img.src = fb;
                }
            }}
        />
    );
}

export default function SellerProfilePage() {
    const { id = "" } = useParams<{ id: string }>();
    const nav = useNavigate();
    const [tab, setTab] = useState<"products" | "reviews">("products");

    // —— 固定 Hooks 顺序：所有 useQuery 在顶部 —— //
    const userQ = useQuery({
        queryKey: ["sellerPublic", id],
        queryFn: () => getUserPublic(id),
        enabled: !!id,
    });

    const productsQ = useQuery({
        queryKey: ["sellerProducts", id],
        queryFn: () => listSellerActive(id, { page: 0, size: 12 }),
        enabled: !!id && tab === "products",
    });

    const reviewsQ = useQuery({
        queryKey: ["sellerReviews", id],
        queryFn: () => listUserReviews(id, { page: 0, size: 10, role: "all", withAppends: true }),
        enabled: !!id && tab === "reviews",
    });

    // —— 渲染早返回（不会影响 Hook 数量） —— //
    if (userQ.isLoading) return <main className="max-w-6xl mx-auto p-6">加载中…</main>;
    if (userQ.isError || !userQ.data)
        return <main className="max-w-6xl mx-auto p-6 text-red-600">卖家不存在或已被封禁</main>;

    const u = userQ.data;

    // 评分与分组（纯函数）
    const reviews = (reviewsQ.data?.content ?? []) as SellerReview[];
    const avg = reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : null;
    const grouped = groupReviews(reviews);

    return (
        <main className="max-w-6xl mx-auto p-6 space-y-6">
            {/* 顶部卖家信息 + Tabs */}
            <section className="bg-white border rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Avatar url={u.avatarUrl} name={u.displayName} size={64} fallback={AVATAR_FALLBACK_64} />
                    <div className="flex-1">
                        <div className="text-lg font-semibold">{u.displayName}</div>
                        {/* 预留 u.bio / u.stats（后端暂未提供） */}
                    </div>
                    <button onClick={() => nav(-1)} className="px-3 py-1.5 rounded bg-gray-100 text-sm">
                        返回
                    </button>
                </div>

                {/* Tabs */}
                <div className="mt-4 flex gap-6 border-b">
                    <TabBtn active={tab === "products"} onClick={() => setTab("products")}>
                        在售商品
                    </TabBtn>
                    <TabBtn active={tab === "reviews"} onClick={() => setTab("reviews")}>
                        评价{avg ? <span className="ml-1 text-gray-500 text-xs">({avg}/5)</span> : null}
                    </TabBtn>
                </div>
            </section>

            {/* Tab 内容 */}
            {tab === "products" ? (
                <section className="bg-white border rounded-xl p-4">
                    {productsQ.isLoading ? (
                        <div>加载中…</div>
                    ) : productsQ.isError ? (
                        <div className="text-sm text-gray-500">商品加载失败</div>
                    ) : (productsQ.data?.content?.length ?? 0) === 0 ? (
                        <div className="text-sm text-gray-500">暂无在售商品</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {productsQ.data!.content.map((p: any) => (
                                <Link
                                    key={p.id}
                                    to={`/product/${p.id}`}
                                    className="border rounded-lg overflow-hidden hover:shadow"
                                    title={p.title}
                                >
                                    <img
                                        src={p.images?.[0] || "https://placehold.co/400x400"}
                                        alt={p.title || "商品图片"}
                                        className="w-full aspect-square object-cover"
                                        loading="lazy"
                                        decoding="async"
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                            const img = e.currentTarget as HTMLImageElement;
                                            img.onerror = null;
                                            img.src = "https://placehold.co/400x400";
                                        }}
                                    />
                                    <div className="p-2">
                                        <div className="text-sm line-clamp-2 h-10">{p.title}</div>
                                        <div className="mt-1 font-semibold">{formatPrice(p.price, p.currency)}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            ) : (
                <section className="bg-white border rounded-xl p-4">
                    {reviewsQ.isLoading ? (
                        <div>加载中…</div>
                    ) : grouped.length === 0 ? (
                        <div className="text-sm text-gray-500">暂无评价</div>
                    ) : (
                        <ul className="space-y-4">
                            {grouped.map(({ root, appends }) => (
                                <li key={String(root.id)} className="border rounded-lg p-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar
                                            url={root.reviewer?.avatarUrl}
                                            name={root.reviewer?.displayName || (root.anonymous ? "匿名" : "用户")}
                                            size={36}
                                            fallback={AVATAR_FALLBACK_40}
                                        />
                                        <div className="flex-1">
                                            <div className="text-sm font-medium">
                                                {root.reviewer?.displayName ?? (root.anonymous ? "匿名" : String(root.reviewer?.id ?? "用户"))}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {root.createdAt ? new Date(root.createdAt).toLocaleString() : ""}
                                            </div>
                                        </div>
                                        <Stars value={root.rating} />
                                    </div>

                                    {!!root.comment && <p className="text-sm mt-2 whitespace-pre-line">{root.comment}</p>}

                                    {/* 追评（AppendBrief） */}
                                    {appends.map((ap) => (
                                        <div
                                            key={String(ap.id)}
                                            className="mt-3 ml-3 bg-gray-50 border rounded p-2 space-y-1"
                                            style={{ borderLeftWidth: 3 }}
                                        >
                                            <div className="flex items-center gap-2">
                                                {/* 如需显示追评人的头像，放开下一行（同样走代理兜底逻辑） */}
                                                {/* <Avatar url={ap.reviewer?.avatarUrl} name={ap.reviewer?.displayName} size={28} /> */}
                                                <span className="text-xs text-gray-500">追评</span>
                                                <div className="text-xs text-gray-500">
                                                    {ap.createdAt ? new Date(ap.createdAt).toLocaleString() : ""}
                                                </div>
                                            </div>
                                            {!!ap.comment && <div className="text-sm whitespace-pre-line">{ap.comment}</div>}
                                        </div>
                                    ))}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}
        </main>
    );
}

/** 把追评挂到主评下面（后端已提供 appends，按时间升序展示） */
function groupReviews(list: SellerReview[]) {
    const arr = Array.isArray(list) ? list : [];
    return arr.map((r) => ({
        root: r,
        appends: Array.isArray(r.appends)
            ? [...r.appends].sort(
                (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
            )
            : [],
    }));
}

function TabBtn({
                    active,
                    onClick,
                    children,
                }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className={`relative px-1 pb-2 text-sm ${
                active ? "font-semibold text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
        >
            {children}
            {active && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-gray-900 rounded-full" />}
        </button>
    );
}

function Stars({ value = 0 }: { value?: number }) {
    const full = Math.max(0, Math.min(5, Math.round(value || 0)));
    return (
        <div className="text-orange-500 text-sm" aria-label={`评分 ${value} / 5`}>
            {"★★★★★☆☆☆☆☆".slice(5 - full, 10 - full)}
        </div>
    );
}

function formatPrice(n: number, c?: string | null) {
    try {
        if (c === "AUD" || c === "CNY")
            return new Intl.NumberFormat("zh-CN", { style: "currency", currency: c }).format(n);
    } catch {}
    return `¥${n}`;
}
