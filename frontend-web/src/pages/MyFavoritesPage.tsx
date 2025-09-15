import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getFavorites, type FavoriteProductCard } from "../api/favorites";
import { removeFavorite } from "../api/products";
import type { ProductRes, Page } from "../api/types";
import { ProductCard } from "../components/ProductCard";

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
                <h1 className="text-xl font-semibold text-gray-900">我的收藏</h1>
                <div className="text-sm text-gray-500">
                    共 {list.length} 件商品
                </div>
            </div>

            {q.isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {Array.from({ length: size }).map((_, i) => (
                        <div key={i} className="h-64 card animate-pulse" />
                    ))}
                </div>
            ) : q.isError ? (
                <div className="text-red-600">加载失败：{(q.error as Error).message}</div>
            ) : list.length === 0 ? (
                <div className="text-sm text-gray-600">暂无收藏</div>
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
                                <div key={idx} className="relative">
                                    {/* 正常商品卡片 */}
                                    <ProductCard p={pForCard} />

                                    {/* 失效商品的灰色遮罩 */}
                                    {inactive && (
                                        <div className="absolute inset-0 bg-gray-500/70 rounded-lg flex items-center justify-center">
                                            <span className="text-white text-lg font-bold">已失效</span>
                                        </div>
                                    )}

                                    {/* 取消收藏按钮 - 在最下方 */}
                                    <button
                                        onClick={() => onRemove(p.id)}
                                        className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10 px-4 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors"
                                    >
                                        取消收藏
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2">
                            <button className="btn btn-secondary" disabled={page <= 0} onClick={() => onPage(page - 1)}>上一页</button>
                            <span className="text-sm text-gray-600">第 {page + 1} / {totalPages} 页</span>
                            <button className="btn btn-secondary" disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)}>下一页</button>
                        </div>
                    )}
                </>
            )}
        </main>
    );
}
