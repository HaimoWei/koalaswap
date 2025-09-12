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
        return <main className="max-w-6xl mx-auto p-6">加载中...</main>;
    }
    if (productQ.isError || !productQ.data) {
        return <main className="max-w-6xl mx-auto p-6 text-red-600">商品不存在或已下架</main>;
    }

    const p = productQ.data;
    const isMine = profile?.id === p.sellerId;

    // ✅ 统一规则：只有 ACTIVE 才能聊/买；其他状态一律禁用
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
            toast("该商品当前不可聊天", "warning");
            return;
        }
        try {
            const conv = await createConversation({ productId: p.id, sellerId: p.sellerId });
            nav(`/chat/${conv.id}`);
        } catch (e: any) {
            toast(e?.message || "发起聊天失败", "error");
        }
    }

    function onOrder() {
        if (!token) {
            const next = encodeURIComponent(`${loc.pathname}${loc.search || ""}`);
            nav(`/login?next=${next}`);
            return;
        }
        if (disabledBuy) {
            toast("该商品当前不可购买", "warning");
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
        if (!(await confirm("下架商品", "确定要下架该商品吗？"))) return;
        try {
            setBusy(true);
            await hideProduct(p.id);
            await qc.invalidateQueries({ queryKey: ["product", id] });
        } catch (e: any) {
            toast(e?.message || "下架失败，请稍后再试", "error");
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
            toast(e?.message || "操作失败，请稍后再试", "error");
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

        const ok = await confirm("删除商品", "删除后不可恢复。若当前在售，将先下架再彻底删除。确认删除吗？");
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
                "删除失败，请稍后再试";

            if (/订单|无法删除|foreign|constraint/i.test(msg)) {
                toast("该商品存在订单记录，无法彻底删除；已为你下架。", "warning");
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

                {/* 操作区 */}
                {isMine ? (
                    <div className="mt-4 flex gap-3">
                        {p.status !== "HIDDEN" ? (
                            <button
                                onClick={onHide}
                                disabled={busy}
                                className="btn btn-secondary disabled:opacity-50"
                            >
                                下架
                            </button>
                        ) : (
                            <button
                                onClick={onRelist}
                                disabled={busy}
                                className="btn btn-secondary disabled:opacity-50"
                            >
                                重新上架
                            </button>
                        )}

                        <button
                            onClick={onDelete}
                            disabled={busy}
                            className="btn btn-danger disabled:opacity-50"
                        >
                            删除
                        </button>
                    </div>
                ) : (
                    <div className="mt-4 flex gap-3">
                        <button
                            onClick={onChat}
                            disabled={disabledChat}
                            className="btn btn-primary disabled:opacity-50"
                        >
                            聊一聊
                        </button>

                        <button
                            onClick={onOrder}
                            disabled={disabledBuy}
                            className="btn btn-secondary disabled:opacity-50"
                        >
                            立即购买
                        </button>

                        {/* ✅ 收藏按钮仅在 ACTIVE 且非卖家时展示 */}
                        {!isMine && p.status === "ACTIVE" && <FavoriteButton productId={p.id} />}
                    </div>
                )}

                {/* ✅ 非 ACTIVE 提示（保留更具体的“已预定”文案） */}
                {!isMine && p.status === "RESERVED" && (
                    <div className="mt-2 text-xs text-[var(--warning)]">
                        该商品已被预定，暂不可聊天或购买
                    </div>
                )}
                {!isMine && p.status && p.status !== "ACTIVE" && p.status !== "RESERVED" && (
                    <div className="mt-2 text-xs text-[var(--warning)]">
                        该商品已失效，暂不可聊天或购买
                    </div>
                )}

                <div className="mt-6 card p-4">
                    <div className="text-sm text-gray-500 mb-2">卖家</div>
                    {sellerQ.isLoading ? (
                        <div className="h-12 bg-gray-100 rounded" />
                    ) : sellerQ.data ? (
                        <div
                            role="button"
                            onClick={() => nav(`/users/${p.sellerId}`)}
                            className="flex items-center gap-3 hover:bg-gray-50 rounded p-2 -m-2 cursor-pointer"
                            title="查看卖家主页"
                        >
                            <img
                                src={sellerQ.data.avatarUrl || "https://placehold.co/40x40"}
                                alt={`${sellerQ.data.displayName || "卖家"}的头像`}
                                className="w-10 h-10 rounded-full border"
                                loading="lazy"
                                decoding="async"
                            />
                            <div className="text-sm">{sellerQ.data.displayName}</div>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500">卖家信息不可用</div>
                    )}
                </div>

                {p.description && (
                <div className="mt-6 card p-4">
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
            <div className="aspect-square bg-[var(--color-muted)] rounded-[var(--radius-xl)] overflow-hidden">
                <img
                    src={list[Math.min(idx, list.length - 1)]}
                    alt="商品图片"
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
                        aria-label={`预览第 ${i + 1} 张图片`}
                    >
                        <img src={url} alt="商品图片缩略图" className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>
        </div>
    );
}

function formatPrice(n: number, c?: string | null) {
    try {
        if (c === "AUD" || c === "CNY") {
            return new Intl.NumberFormat("zh-CN", { style: "currency", currency: c }).format(n);
        }
    } catch {}
    return `¥${n}`;
}
function mapCondition(c: string) {
    const m: Record<string, string> = { NEW: "全新", LIKE_NEW: "九成新", GOOD: "良好", FAIR: "一般" };
    return m[c] || c;
}
function mapStatus(s: string) {
    const m: Record<string, string> = {
        ACTIVE: "在售",
        RESERVED: "已预定",
        SOLD: "已售出",
        HIDDEN: "隐藏",
    };
    return m[s] || s;
}
