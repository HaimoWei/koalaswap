import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getFavorites, type FavoriteProductCard } from "../api/favorites";
import { removeFavorite } from "../api/products";
import type { ProductRes, Page } from "../api/types"; // ★ 引入 Page<T> 的类型
import { ProductCard } from "../components/ProductCard";

function pickProduct(x: FavoriteProductCard): ProductRes {
    return (x as any).product ? (x as any).product : (x as ProductRes);
}

export function MyFavoritesPage() {
    const [sp, setSp] = useSearchParams();
    const page = parseInt(sp.get("page") || "0", 10);
    const size = parseInt(sp.get("size") || "20", 10);
    const qc = useQueryClient();

    // ★ 用泛型告诉 React Query：这个查询返回的是 Page<FavoriteProductCard>
    const q = useQuery<Page<FavoriteProductCard>>({
        queryKey: ["favorites", page, size],
        queryFn: () => getFavorites({ page, size }),
        // v5 没有 keepPreviousData，用 placeholderData 让翻页时不抖动
        placeholderData: (prev) => prev as any,
    });

    const onPage = (p: number) => {
        const next = new URLSearchParams(sp);
        next.set("page", String(p));
        setSp(next);
    };

    async function onRemove(productId: string) {
        await removeFavorite(productId);
        // 取消收藏后刷新当前列表
        qc.invalidateQueries({ queryKey: ["favorites"] });
    }

    // ★ 这几个值有了泛型之后就不会爆红
    const list = q.data?.content ?? [];
    const totalPages = q.data?.totalPages ?? 1;

    return (
        <main className="max-w-6xl mx-auto p-6 space-y-4">
            <h1 className="text-xl font-semibold">我的收藏</h1>

            {q.isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {Array.from({ length: size }).map((_, i) => (
                        <div key={i} className="h-64 bg-white border rounded animate-pulse" />
                    ))}
                </div>
            ) : q.isError ? (
                <div className="text-red-600">加载失败：{(q.error as Error).message}</div>
            ) : list.length === 0 ? (
                <div className="text-sm text-gray-600">暂无收藏</div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {list.map((item, idx) => {
                            const p = pickProduct(item);
                            return (
                                <div key={idx} className="relative">
                                    <ProductCard p={p} />
                                    <button
                                        onClick={() => onRemove(p.id)}
                                        className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-black/70 text-white"
                                    >
                                        取消收藏
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2">
                            <button
                                className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
                                disabled={page <= 0}
                                onClick={() => onPage(page - 1)}
                            >
                                上一页
                            </button>
                            <span className="text-sm text-gray-600">
                第 {page + 1} / {totalPages} 页
              </span>
                            <button
                                className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
                                disabled={page >= totalPages - 1}
                                onClick={() => onPage(page + 1)}
                            >
                                下一页
                            </button>
                        </div>
                    )}
                </>
            )}
        </main>
    );
}
