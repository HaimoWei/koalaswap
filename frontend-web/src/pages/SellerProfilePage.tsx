// src/pages/SellerProfilePage.tsx
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getUserPublic } from "../api/users";
import { listSellerActive } from "../api/products";
import { listUserReviews, type SellerReview } from "../api/reviews";
import { UserProfileCard } from "../components/UserProfileCard";

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

    // 计算会员年数
    const memberYears = u.memberSince ? Math.floor((new Date().getTime() - new Date(u.memberSince).getTime()) / (365 * 24 * 60 * 60 * 1000)) : 0;

    // 格式化最后活跃时间
    const formatLastActive = (lastActiveAt?: string) => {
        if (!lastActiveAt) return "最近活跃: 未知";

        const now = Date.now();
        const lastActive = new Date(lastActiveAt).getTime();
        const diff = now - lastActive;

        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return "最近活跃: 刚刚";
        if (minutes < 60) return `最近活跃: ${minutes}分钟前`;
        if (hours < 24) return `最近活跃: ${hours}小时前`;
        if (days < 7) return `最近活跃: ${days}天前`;
        if (days < 30) return `最近活跃: ${days}天前`;

        const date = new Date(lastActiveAt);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `最近活跃: ${month}月${day}日`;
    };

    // 评分与分组（纯函数）
    const reviews = (reviewsQ.data?.content ?? []) as SellerReview[];
    const avg = reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : null;
    const grouped = groupReviews(reviews);

    return (
        <main className="max-w-6xl mx-auto p-6 space-y-6">
            {/* 顶部卖家信息 */}
            <section className="card p-6">
                <div className="flex items-start gap-6">
                    <Avatar url={u.avatarUrl} name={u.displayName} size={80} fallback={AVATAR_FALLBACK_64} />
                    <div className="flex-1 space-y-4">
                        <div>
                            <div className="text-xl font-semibold mb-2">{u.displayName}</div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                {u.location && (
                                    <div className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {u.location}
                                    </div>
                                )}
                                {memberYears > 0 && <span>会员{memberYears}年</span>}
                                <span>{formatLastActive(u.lastActiveAt)}</span>
                            </div>
                        </div>

                        {/* 个人简介 */}
                        {u.bio && (
                            <div className="text-gray-700 leading-relaxed">
                                {u.bio}
                            </div>
                        )}

                        {/* 信誉和统计信息 */}
                        <div className="grid grid-cols-2 gap-8 py-4 border-t border-gray-100">
                            <div className="text-center">
                                <div className="text-lg font-semibold text-orange-500">
                                    {u.ratingAvg && u.ratingAvg > 0 ? u.ratingAvg.toFixed(1) : "暂无"}
                                </div>
                                <div className="text-xs text-gray-500">好评度</div>
                                <div className="text-xs text-gray-400 mt-1">
                                    {u.ratingCount || 0}条评价
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-semibold text-purple-500">
                                    {productsQ.data?.totalElements || 0}
                                </div>
                                <div className="text-xs text-gray-500">在售商品</div>
                                <div className="text-xs text-gray-400 mt-1">
                                    加入于{u.memberSince ? new Date(u.memberSince).getFullYear() : '未知'}年
                                </div>
                            </div>
                        </div>

                        {/* 认证信息 */}
                        <div className="flex items-center gap-4 pt-2">
                            <span className="text-xs text-gray-500">认证状态:</span>
                            <div className="flex gap-3">
                                {u.phoneVerified ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                        </svg>
                                        手机已认证
                                    </span>
                                ) : (
                                    <span className="text-xs text-gray-400">手机未认证</span>
                                )}
                                {u.emailVerified ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                        </svg>
                                        邮箱已认证
                                    </span>
                                ) : (
                                    <span className="text-xs text-gray-400">邮箱未认证</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button onClick={() => nav(-1)} className="btn btn-secondary text-sm">
                        返回
                    </button>
                </div>
            </section>

            {/* Tabs 导航 */}
            <div className="flex gap-6 border-b border-[var(--color-border)]">
                <TabBtn active={tab === "products"} onClick={() => setTab("products")}>
                    在售商品
                </TabBtn>
                <TabBtn active={tab === "reviews"} onClick={() => setTab("reviews")}>
                    评价{avg ? <span className="ml-1 text-gray-500 text-xs">({avg}/5)</span> : null}
                </TabBtn>
            </div>

            {/* Tab 内容 */}
            <section>
                {tab === "products" ? (
                    <div>
                        {productsQ.isLoading ? (
                            <div className="text-center py-8 text-gray-500">加载中…</div>
                        ) : productsQ.isError ? (
                            <div className="text-center py-8 text-gray-500">商品加载失败</div>
                        ) : (productsQ.data?.content?.length ?? 0) === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-gray-400 text-6xl mb-4">📦</div>
                                <div className="text-gray-500">暂无在售商品</div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {productsQ.data!.content.map((p: any) => (
                                    <Link
                                        key={p.id}
                                        to={`/product/${p.id}`}
                                        className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
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
                                        <div className="p-3">
                                            <div className="text-sm line-clamp-2 h-10 text-gray-800">{p.title}</div>
                                            <div className="mt-2 font-bold text-orange-600">{formatPrice(p.price, p.currency)}</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        {reviewsQ.isLoading ? (
                            <div className="text-center py-8 text-gray-500">加载中…</div>
                        ) : grouped.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-gray-400 text-6xl mb-4">⭐</div>
                                <div className="text-gray-500">暂无评价</div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {grouped.map(({ root, appends }) => (
                                    <div key={String(root.id)} className="border border-gray-200 rounded-lg p-4 bg-white">
                                        <div className="flex items-center gap-3">
                                            <Avatar
                                                url={root.reviewer?.avatarUrl}
                                                name={root.reviewer?.displayName || (root.anonymous ? "匿名" : "用户")}
                                                size={36}
                                                fallback={AVATAR_FALLBACK_40}
                                            />
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {root.reviewer?.displayName ?? (root.anonymous ? "匿名" : String(root.reviewer?.id ?? "用户"))}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {root.createdAt ? new Date(root.createdAt).toLocaleString() : ""}
                                                </div>
                                            </div>
                                            <Stars value={root.rating} />
                                        </div>

                                        {!!root.comment && <p className="text-sm mt-3 text-gray-700 leading-relaxed whitespace-pre-line">{root.comment}</p>}

                                        {/* 追评 */}
                                        {appends.map((ap) => (
                                            <div
                                                key={String(ap.id)}
                                                className="mt-3 ml-3 bg-orange-50 border-l-4 border-orange-200 rounded-r p-3"
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs text-orange-600 font-medium">追评</span>
                                                    <div className="text-xs text-gray-500">
                                                        {ap.createdAt ? new Date(ap.createdAt).toLocaleString() : ""}
                                                    </div>
                                                </div>
                                                {!!ap.comment && <div className="text-sm text-gray-700 whitespace-pre-line">{ap.comment}</div>}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </section>
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
