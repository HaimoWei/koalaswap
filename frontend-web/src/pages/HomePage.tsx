import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchHomeProducts } from "../api/products";
import { ProductCard } from "../components/ProductCard";
import { Paginator } from "../components/Paginator";

export function HomePage() {
    // 简单分页：本地 state（首页不走 URL）
    const [page, setPage] = useState(0);
    const size = 20;

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["home", page, size],
        queryFn: () => fetchHomeProducts({ page, size, sort: "createdAt,desc" }),
        staleTime: 30_000,
        placeholderData: (prev) => prev as any,
    });

    return (
        <main className="max-w-6xl mx-auto p-6">
            {/* Banner 占位（对齐闲鱼） */}
            <div className="h-40 rounded-xl bg-gradient-to-r from-gray-200 to-gray-100 mb-6" />

            {/* 商品网格 */}
            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {Array.from({ length: size }).map((_, i) => (
                        <div key={i} className="rounded-lg border bg-white p-3 h-64 animate-pulse" />
                    ))}
                </div>
            ) : isError ? (
                <div className="text-red-600">加载失败：{(error as Error)?.message}</div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {data?.content.map((p) => <ProductCard key={p.id} p={p} />)}
                    </div>

                    <Paginator
                        page={data?.number || 0}
                        totalPages={data?.totalPages || 1}
                        onPageChange={setPage}
                    />
                </>
            )}
        </main>
    );
}
