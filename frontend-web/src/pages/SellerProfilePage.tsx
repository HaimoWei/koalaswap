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

/** Proxy third-party images via a public CDN to avoid 521/CORS/hotlinking issues */
function proxyImg(url: string, size: number) {
    // images.weserv.nl requires protocol-stripped URL
    const noProto = url.replace(/^https?:\/\//i, "");
    // fit=cover ensures a square cropped image
    return `https://images.weserv.nl/?url=${encodeURIComponent(noProto)}&w=${size}&h=${size}&fit=cover`;
}

/** Avatar component: try original URL, then proxy, then fallback */
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
    const alt = name ? `${name}'s avatar` : "User avatar";

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
            // ⚠️ Do not add crossOrigin to avoid turning a normal <img> into a CORS image
            onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                const tried = img.getAttribute("data-tried") || "";
                // First failure: if there is an original URL, try proxy
                if (url && tried !== "proxy") {
                    img.setAttribute("data-tried", "proxy");
                    img.src = proxyImg(url, size);
                    return;
                }
                // Second failure: fall back to placeholder
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

    // —— Keep hook order fixed: all useQuery calls at the top —— //
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

    // —— Early returns for loading/error (do not affect hook count) —— //
    if (userQ.isLoading) return <main className="max-w-6xl mx-auto p-6">Loading…</main>;
    if (userQ.isError || !userQ.data)
        return (
            <main className="max-w-6xl mx-auto p-6 text-red-600">
                Seller does not exist or has been banned.
            </main>
        );

    const u = userQ.data;

    // Calculate membership years
    const memberYears = u.memberSince ? Math.floor((new Date().getTime() - new Date(u.memberSince).getTime()) / (365 * 24 * 60 * 60 * 1000)) : 0;

    // Format last active time
    const formatLastActive = (lastActiveAt?: string) => {
        if (!lastActiveAt) return "Last active: unknown";

        const now = Date.now();
        const lastActive = new Date(lastActiveAt).getTime();
        const diff = now - lastActive;

        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return "Last active: just now";
        if (minutes < 60) return `Last active: ${minutes} minutes ago`;
        if (hours < 24) return `Last active: ${hours} hours ago`;
        if (days < 7) return `Last active: ${days} days ago`;
        if (days < 30) return `Last active: ${days} days ago`;

        const date = new Date(lastActiveAt);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `Last active: ${month}/${day}`;
    };

    // Rating and grouping (pure functions)
    const reviews = (reviewsQ.data?.content ?? []) as SellerReview[];
    const avg = reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : null;
    const grouped = groupReviews(reviews);

    return (
        <main className="max-w-6xl mx-auto p-6 space-y-6">
                        {/* Top seller info */}
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
                                {memberYears > 0 && <span>Member for {memberYears} years</span>}
                                <span>{formatLastActive(u.lastActiveAt)}</span>
                            </div>
                        </div>

                        {/* Bio */}
                        {u.bio && (
                            <div className="text-gray-700 leading-relaxed">
                                {u.bio}
                            </div>
                        )}

                        {/* Ratings and stats */}
                        <div className="grid grid-cols-2 gap-8 py-4 border-t border-gray-100">
                            <div className="text-center">
                                <div className="text-lg font-semibold text-orange-500">
                                    {u.ratingAvg && u.ratingAvg > 0 ? u.ratingAvg.toFixed(1) : "N/A"}
                                </div>
                                <div className="text-xs text-gray-500">Rating</div>
                                <div className="text-xs text-gray-400 mt-1">
                                    {u.ratingCount || 0} reviews
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-semibold text-purple-500">
                                    {productsQ.data?.totalElements || 0}
                                </div>
                                <div className="text-xs text-gray-500">Active listings</div>
                                <div className="text-xs text-gray-400 mt-1">
                                    Joined in {u.memberSince ? new Date(u.memberSince).getFullYear() : 'Unknown'}
                                </div>
                            </div>
                        </div>

                        {/* Verification info */}
                        <div className="flex items-center gap-4 pt-2">
                            <span className="text-xs text-gray-500">Verification status:</span>
                            <div className="flex gap-3">
                                {u.phoneVerified ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                        </svg>
                                        Phone verified
                                    </span>
                                ) : (
                                    <span className="text-xs text-gray-400">Phone not verified</span>
                                )}
                                {u.emailVerified ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                        </svg>
                                        Email verified
                                    </span>
                                ) : (
                                    <span className="text-xs text-gray-400">Email not verified</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button onClick={() => nav(-1)} className="btn btn-secondary text-sm">
                        Back
                    </button>
                </div>
            </section>

            {/* Tabs navigation */}
            <div className="flex gap-6 border-b border-[var(--color-border)]">
                <TabBtn active={tab === "products"} onClick={() => setTab("products")}>
                    Active listings
                </TabBtn>
                <TabBtn active={tab === "reviews"} onClick={() => setTab("reviews")}>
                    Reviews{avg ? <span className="ml-1 text-gray-500 text-xs">({avg}/5)</span> : null}
                </TabBtn>
            </div>

            {/* Tab content */}
            <section>
                {tab === "products" ? (
                    <div>
                        {productsQ.isLoading ? (
                            <div className="text-center py-8 text-gray-500">Loading…</div>
                        ) : productsQ.isError ? (
                            <div className="text-center py-8 text-gray-500">Failed to load items</div>
                        ) : (productsQ.data?.content?.length ?? 0) === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-gray-400 text-6xl mb-4">📦</div>
                                <div className="text-gray-500">No active listings</div>
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
                                            alt={p.title || "Item image"}
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
                            <div className="text-center py-8 text-gray-500">Loading…</div>
                        ) : grouped.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-gray-400 text-6xl mb-4">⭐</div>
                                <div className="text-gray-500">No reviews yet</div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {grouped.map(({ root, appends }) => (
                                    <div key={String(root.id)} className="border border-gray-200 rounded-lg p-4 bg-white">
                                        <div className="flex items-center gap-3">
                                            <Avatar
                                                url={root.reviewer?.avatarUrl}
                                                name={root.reviewer?.displayName || (root.anonymous ? "Anonymous" : "User")}
                                                size={36}
                                                fallback={AVATAR_FALLBACK_40}
                                            />
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {root.reviewer?.displayName ?? (root.anonymous ? "Anonymous" : String(root.reviewer?.id ?? "User"))}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {root.createdAt ? new Date(root.createdAt).toLocaleString() : ""}
                                                </div>
                                            </div>
                                            <Stars value={root.rating} />
                                        </div>

                                        {!!root.comment && <p className="text-sm mt-3 text-gray-700 leading-relaxed whitespace-pre-line">{root.comment}</p>}

                                        {/* Additional reviews */}
                                        {appends.map((ap) => (
                                            <div
                                            key={String(ap.id)}
                                                className="mt-3 ml-3 bg-orange-50 border-l-4 border-orange-200 rounded-r p-3"
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs text-orange-600 font-medium">Additional review</span>
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
        <div className="text-orange-500 text-sm" aria-label={`Rating ${value} / 5`}>
            {"★★★★★☆☆☆☆☆".slice(5 - full, 10 - full)}
        </div>
    );
}

function formatPrice(n: number, c?: string | null) {
    try {
        if (c === "AUD" || c === "CNY")
            return new Intl.NumberFormat("en-AU", { style: "currency", currency: c }).format(n);
    } catch {}
    return `$${n}`;
}
