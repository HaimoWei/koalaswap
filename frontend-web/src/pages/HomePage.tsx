import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchHomeProducts } from "../api/products";
import { ProductCard } from "../components/ProductCard";
import { Paginator } from "../components/Paginator";
import { PromoBanner } from "../components/PromoBanner";
import { CategoryChips } from "../components/CategoryChips";
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
        <main className="page py-6">
            {/* 大广告栏：注册享好礼 */}
            <PromoBanner />
            <CategoryChips />
            <TrustBadges />

            {/* 商品区（大组件边框包裹） */}
            {isLoading ? (
                <section className="card p-4 md:p-6">
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
