// src/pages/ProductDetailPage.tsx
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getProduct, hideProduct, relistProduct, deleteProduct } from "../api/products";
import { getUserBrief } from "../api/users";
import { useAuthStore } from "../store/auth";
import { toast, confirm } from "../store/overlay";
import { createConversation } from "../api/chat";
import { FavoriteButton } from "../features/products/FavoriteButton";

export function ProductDetailPage() {
    const { id = "" } = useParams<{ id: string }>();
    const nav = useNavigate();
    const loc = useLocation();
    const qc = useQueryClient();
    const { profile, token } = useAuthStore();
    const [busy, setBusy] = useState(false);

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
        return <main className="max-w-6xl mx-auto p-6">Loading...</main>;
    }
    if (productQ.isError || !productQ.data) {
        return (
            <main className="max-w-6xl mx-auto p-6 text-red-600">
                This item does not exist or is no longer available.
            </main>
        );
    }

    const p = productQ.data;
    const isMine = profile?.id === p.sellerId;

    // ✅ Rule: only ACTIVE items can be chatted about or purchased; other statuses are disabled
    const notActive = p.status !== "ACTIVE";
    const disabledChat = isMine || notActive;
    const disabledBuy = isMine || notActive;

    async function onChat() {
        if (!token) {
            const next = encodeURIComponent(`${loc.pathname}${loc.search || ""}`);
            nav(`/login?next=${next}`);
            return;
        }
        if (disabledChat) {
            toast("This item is currently unavailable for chat.", "warning");
            return;
        }
        try {
            const conv = await createConversation({ productId: p.id, sellerId: p.sellerId });
            window.open(`/chat/${conv.id}`, "_blank", "noopener");
        } catch (e: any) {
            toast(e?.message || "Failed to start chat.", "error");
        }
    }

    function onOrder() {
        if (!token) {
            const next = encodeURIComponent(`${loc.pathname}${loc.search || ""}`);
            nav(`/login?next=${next}`);
            return;
        }
        if (disabledBuy) {
            toast("This item is currently unavailable for purchase.", "warning");
            return;
        }
        nav(`/checkout/${p.id}`);
    }

    async function onHide() {
        if (!token) {
            const next = encodeURIComponent(`${loc.pathname}${loc.search || ""}`);
            nav(`/login?next=${next}`);
            return;
        }
        if (
            !(await confirm(
                "Hide item",
                "Are you sure you want to hide this item?"
            ))
        )
            return;
        try {
            setBusy(true);
            await hideProduct(p.id);
            await qc.invalidateQueries({ queryKey: ["product", id] });
        } catch (e: any) {
            toast(e?.message || "Failed to hide item. Please try again later.", "error");
        } finally {
            setBusy(false);
        }
    }

    async function onRelist() {
        if (!token) {
            const next = encodeURIComponent(`${loc.pathname}${loc.search || ""}`);
            nav(`/login?next=${next}`);
            return;
        }
        try {
            setBusy(true);
            await relistProduct(p.id);
            await qc.invalidateQueries({ queryKey: ["product", id] });
        } catch (e: any) {
            toast(e?.message || "Operation failed. Please try again later.", "error");
        } finally {
            setBusy(false);
        }
    }

    async function onDelete() {
        if (!token) {
            const next = encodeURIComponent(`${loc.pathname}${loc.search || ""}`);
            nav(`/login?next=${next}`);
            return;
        }

        const ok = await confirm(
            "Delete item",
            "This action cannot be undone. If the item is currently on sale, it will be hidden first and then permanently deleted. Are you sure you want to delete it?"
        );
        if (!ok) return;

        try {
            setBusy(true);
            if (p.status !== "HIDDEN") {
                await hideProduct(p.id);
            }
            await deleteProduct(p.id, true);
            nav("/me/listings");
        } catch (e: any) {
            const msg =
                e?.response?.data?.message ||
                e?.message ||
                "Failed to delete item. Please try again later.";

            if (/订单|无法删除|foreign|constraint/i.test(msg)) {
                toast(
                    "This item has existing order records and cannot be permanently deleted; it has been hidden instead.",
                    "warning"
                );
                await qc.invalidateQueries({ queryKey: ["product", id] });
                return;
            }
            toast(msg, "error");
        } finally {
            setBusy(false);
        }
    }

    return (
        <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <Gallery images={p.images} />
            </div>

            <div>
                <h1 className="text-xl font-semibold">{p.title}</h1>
                <div className="mt-2 text-2xl font-bold">{formatPrice(p.price, p.currency)}</div>

                <div className="mt-2 flex gap-2">
                    {((p as any).freeShipping || (p as any).free_shipping) && (
                        <span className="chip chip-primary" title="Seller covers the shipping cost">
                            Free shipping
                        </span>
                    )}
                    {p.condition && (
                        <span className="chip chip-secondary">
                            {mapCondition(p.condition)}
                        </span>
                    )}
                    {p.status && p.status !== "ACTIVE" && (
                        <span className="chip chip-muted">
                            {mapStatus(p.status)}
                        </span>
                    )}
                </div>

                {/* Action area */}
                {isMine ? (
                    <div className="mt-4 flex gap-3">
                        <button
                            onClick={() => nav(`/products/${p.id}/edit`)}
                            disabled={busy}
                            className="btn btn-primary disabled:opacity-50"
                        >
                            Edit item
                        </button>

                        {p.status !== "HIDDEN" ? (
                            <button
                                onClick={onHide}
                                disabled={busy}
                                className="btn btn-secondary disabled:opacity-50"
                            >
                                Hide
                            </button>
                        ) : (
                            <button
                                onClick={onRelist}
                                disabled={busy}
                                className="btn btn-secondary disabled:opacity-50"
                            >
                                Relist
                            </button>
                        )}

                        <button
                            onClick={onDelete}
                            disabled={busy}
                            className="btn btn-danger disabled:opacity-50"
                        >
                            Delete
                        </button>
                    </div>
                ) : (
                    <div className="mt-4 flex gap-3">
                        <button
                            onClick={onChat}
                            disabled={disabledChat}
                            className="btn btn-primary disabled:opacity-50"
                        >
                            Chat with seller
                        </button>

                        <button
                            onClick={onOrder}
                            disabled={disabledBuy}
                            className="btn btn-secondary disabled:opacity-50"
                        >
                            Buy now
                        </button>

                        {/* ✅ 收藏按钮仅在 ACTIVE 且非卖家时展示 */}
                        {!isMine && p.status === "ACTIVE" && <FavoriteButton productId={p.id} />}
                    </div>
                )}

                {/* ✅ Non-ACTIVE hints (keep specific 'reserved' copy) */}
                {!isMine && p.status === "RESERVED" && (
                    <div className="mt-2 text-xs text-[var(--warning)]">
                        This item has been reserved and is temporarily unavailable for chat or purchase.
                    </div>
                )}
                {!isMine && p.status && p.status !== "ACTIVE" && p.status !== "RESERVED" && (
                    <div className="mt-2 text-xs text-[var(--warning)]">
                        This item is no longer available and is temporarily unavailable for chat or purchase.
                    </div>
                )}

                <div className="mt-6 card p-4">
                    <div className="text-sm text-gray-500 mb-2">Seller</div>
                    {sellerQ.isLoading ? (
                        <div className="h-12 bg-gray-100 rounded" />
                    ) : sellerQ.data ? (
                        <div
                            role="button"
                            onClick={() => nav(`/users/${p.sellerId}`)}
                            className="flex items-center gap-3 hover:bg-gray-50 rounded p-2 -m-2 cursor-pointer"
                            title="View seller profile"
                        >
                            <img
                                src={sellerQ.data.avatarUrl || "https://placehold.co/40x40"}
                                alt={`${sellerQ.data.displayName || "Seller"} avatar`}
                                className="w-10 h-10 rounded-full border"
                                loading="lazy"
                                decoding="async"
                            />
                            <div className="text-sm">{sellerQ.data.displayName}</div>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500">Seller information is not available.</div>
                    )}
                </div>

                {p.description && (
                    <div className="mt-6 card p-4">
                        <div className="text-sm text-gray-500 mb-2">Description</div>
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
            <div className="aspect-square bg-[var(--color-muted)] rounded-[var(--radius-xl)] overflow-hidden">
                <img
                    src={list[Math.min(idx, list.length - 1)]}
                    alt="Item image"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                />
            </div>
            <div className="mt-3 grid grid-cols-5 gap-2">
                {list.map((url, i) => (
                    <button
                        key={i}
                        onClick={() => setIdx(i)}
                        className={`aspect-square rounded border overflow-hidden ${
                            i === idx ? "ring-2 ring-[var(--ring)]" : ""
                        }`}
                        aria-label={`Preview image ${i + 1}`}
                    >
                        <img src={url} alt="Item thumbnail" className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>
        </div>
    );
}

function formatPrice(n: number, c?: string | null) {
    try {
        if (c === "AUD" || c === "CNY") {
            return new Intl.NumberFormat("en-AU", { style: "currency", currency: c }).format(n);
        }
    } catch {}
    return `$${n}`;
}
function mapCondition(c: string) {
    const m: Record<string, string> = {
        NEW: "Brand new",
        LIKE_NEW: "Like new",
        GOOD: "Good",
        FAIR: "Fair",
        POOR: "Well-used",
    };
    return m[c] || c;
}
function mapStatus(s: string) {
    const m: Record<string, string> = {
        ACTIVE: "On sale",
        RESERVED: "Reserved",
        SOLD: "Sold",
        HIDDEN: "Hidden",
    };
    return m[s] || s;
}
