import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getFavorites, type FavoriteProductCard } from "../api/favorites";
import { removeFavorite } from "../api/products";
import type { ProductRes, Page } from "../api/types";
import { FavoriteProductCard } from "../components/FavoriteProductCard";

function pickProduct(x: FavoriteProductCard): ProductRes {
    // 收藏接口里可能是 { product, favoritedAt, firstImageUrl }
    // 也可能直接就是 ProductRes（兼容）
    return (x as any).product ? (x as any).product : (x as ProductRes);
}

export function MyFavoritesPage() {
    const [sp, setSp] = useSearchParams();
    const page = parseInt(sp.get("page") || "0", 10);
    const size = parseInt(sp.get("size") || "20", 10);
    const qc = useQueryClient();

    const q = useQuery<Page<FavoriteProductCard>>({
        queryKey: ["favorites", page, size],
        queryFn: () => getFavorites({ page, size }),
        placeholderData: (prev) => prev as any,
    });

    const onPage = (p: number) => {
        const next = new URLSearchParams(sp);
        next.set("page", String(p));
        setSp(next);
    };

    async function onRemove(productId: string) {
        await removeFavorite(productId);
        qc.invalidateQueries({ queryKey: ["favorites"] });
    }

    const list = q.data?.content ?? [];
    const totalPages = q.data?.totalPages ?? 1;

    return (
        <main className="page py-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-semibold text-gray-900">My favorites</h1>
                <div className="text-sm text-gray-500">
                    Total <b>{list.length}</b> items
                </div>
            </div>

            {q.isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {Array.from({ length: size }).map((_, i) => (
                        <div key={i} className="h-64 card animate-pulse" />
                    ))}
                </div>
            ) : q.isError ? (
                <div className="text-red-600">Failed to load: {(q.error as Error).message}</div>
            ) : list.length === 0 ? (
                <div className="text-sm text-gray-600">No favorites yet</div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {list.map((item, idx) => {
                            const p = pickProduct(item);

                            // ✅ 取后端 firstImageUrl；再退到 p.images[0]；最后占位图
                            const cover =
                                (item as any).firstImageUrl ||
                                (p as any).firstImageUrl ||
                                p.images?.[0] ||
                                "https://placehold.co/800x800?text=No+Image";

                            // ✅ 不改 ProductCard：在这里把 cover 塞进 images[0]
                            const pForCard: ProductRes = {
                                ...p,
                                images: [cover],
                            };

                            const inactive = p.status && p.status !== "ACTIVE";

                            return (
                                <FavoriteProductCard
                                    key={idx}
                                    product={pForCard}
                                    onRemove={onRemove}
                                />
                            );
                        })}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2">
                            <button
                                className="btn btn-secondary"
                                disabled={page <= 0}
                                onClick={() => onPage(page - 1)}
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-600">
                                Page {page + 1} / {totalPages}
                            </span>
                            <button
                                className="btn btn-secondary"
                                disabled={page >= totalPages - 1}
                                onClick={() => onPage(page + 1)}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </main>
    );
}
