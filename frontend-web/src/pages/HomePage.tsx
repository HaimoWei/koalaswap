import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchHomeProducts } from "../api/products";
import { ProductCard } from "../components/ProductCard";
import { PromoBanner } from "../components/PromoBanner";
import { TaobaoStyleNavigation } from "../components/TaobaoStyleNavigation";
import { TrustBadges } from "../components/TrustBadges";
import { useAuthStore } from "../store/auth";

export function HomePage() {
    const size = 20;
    const token = useAuthStore((s) => s.token);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const {
        data,
        isLoading,
        isError,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ["home-infinite", size, token ? "auth" : "guest"],
        queryFn: ({ pageParam = 0 }) =>
            fetchHomeProducts({ page: pageParam, size, sort: "createdAt,desc" }),
        getNextPageParam: (lastPage) => {
            // 如果还有下一页，返回下一页页码
            return lastPage.number < lastPage.totalPages - 1
                ? lastPage.number + 1
                : undefined;
        },
        initialPageParam: 0,
        staleTime: 30_000,
    });

    // 使用 Intersection Observer 实现无限滚动
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                // 当加载触发器进入视口时，加载下一页
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1, rootMargin: "100px" } // 提前100px触发加载
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => {
            if (loadMoreRef.current) {
                observer.unobserve(loadMoreRef.current);
            }
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // 合并所有页的商品数据
    const allProducts = data?.pages.flatMap((page) => page.content) ?? [];

    return (
        <main className="page py-4">
            {/* 淘宝风格：左侧分类导航 + 右侧宣传栏 */}
            <div className="card flex gap-4 mb-3 p-4">
                <TaobaoStyleNavigation className="flex-shrink-0" />
                <div className="flex-1">
                    <PromoBanner />
                </div>
            </div>

            <div className="mb-3">
                <TrustBadges />
            </div>

            {/* 商品区（猜你喜欢） */}
            <section className="card p-4 md:p-6">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-2xl">🎯</span>
                        猜你喜欢
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">为你精选的优质二手商品</p>
                </div>

                {isError ? (
                    <div className="text-center text-red-600 py-8">
                        加载失败：{(error as Error)?.message}
                    </div>
                ) : (
                    <>
                        {/* 商品网格 */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                            {allProducts.map((p) => (
                                <ProductCard key={p.id} p={p} />
                            ))}

                            {/* 首次加载骨架屏 */}
                            {isLoading &&
                                Array.from({ length: size }).map((_, i) => (
                                    <div key={`skeleton-${i}`} className="card p-3 h-64 animate-pulse bg-gray-200" />
                                ))}
                        </div>

                        {/* 加载更多触发器和状态指示 */}
                        <div ref={loadMoreRef} className="mt-8 text-center">
                            {isFetchingNextPage ? (
                                <div className="flex items-center justify-center gap-2 text-gray-600">
                                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    <span>加载更多商品...</span>
                                </div>
                            ) : hasNextPage ? (
                                <div className="text-gray-400 text-sm">向下滚动加载更多</div>
                            ) : allProducts.length > 0 ? (
                                <div className="text-gray-400 text-sm py-4">
                                    已经到底啦~ 共 {allProducts.length} 件商品
                                </div>
                            ) : (
                                <div className="text-gray-400 text-sm py-8">暂无商品</div>
                            )}
                        </div>
                    </>
                )}
            </section>
        </main>
    );
}
