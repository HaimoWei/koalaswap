import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchHomeProducts } from "../api/products";
import { ProductCard } from "../components/ProductCard";
import { Paginator } from "../components/Paginator";
import { PromoBanner } from "../components/PromoBanner";
import { TaobaoStyleNavigation } from "../components/TaobaoStyleNavigation";
import { TrustBadges } from "../components/TrustBadges";
import { useAuthStore } from "../store/auth";

export function HomePage() {
    // 简单分页：本地 state（首页不走 URL）
    const [page, setPage] = useState(0);
    const size = 20;
    const token = useAuthStore((s) => s.token); // ★ 让首页数据对登录态敏感

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["home", page, size, token ? "auth" : "guest"], // ★ 加入影子键
        queryFn: () => fetchHomeProducts({ page, size, sort: "createdAt,desc" }),
        staleTime: 30_000,
        placeholderData: (prev) => prev as any,
    });

    return (
        <main className="page py-4">
            {/* 淘宝风格：左侧分类导航 + 右侧宣传栏 */}
            <div className="card flex gap-4 mb-3 min-h-[300px] p-4">
                <TaobaoStyleNavigation />
                <div className="flex-1">
                    <PromoBanner />
                </div>
            </div>

            <div className="mb-3">
                <TrustBadges />
            </div>

            {/* 商品区（猜你喜欢） */}
            {isLoading ? (
                <section className="card p-4 md:p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <span className="text-2xl">🎯</span>
                            猜你喜欢
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">为你精选的优质二手商品</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {Array.from({ length: size }).map((_, i) => (
                            <div key={i} className="card p-3 h-64 animate-pulse" />
                        ))}
                    </div>
                </section>
            ) : isError ? (
                <div className="text-red-600">加载失败：{(error as Error)?.message}</div>
            ) : (
                <section className="card p-4 md:p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <span className="text-2xl">🎯</span>
                            猜你喜欢
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">为你精选的优质二手商品</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {data?.content.map((p) => <ProductCard key={p.id} p={p} />)}
                    </div>
                    <Paginator
                        page={data?.number || 0}
                        totalPages={data?.totalPages || 1}
                        onPageChange={setPage}
                    />
                </section>
            )}
        </main>
    );
}
