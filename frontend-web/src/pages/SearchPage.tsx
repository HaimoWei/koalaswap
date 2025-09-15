import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { searchProducts } from "../api/products";
import { ProductCard } from "../components/ProductCard";
import { Paginator } from "../components/Paginator";
import { FiltersBar } from "../features/products/FiltersBar";

export function SearchPage() {
    const [sp, setSp] = useSearchParams();

    const params = useMemo(() => {
        const page = parseInt(sp.get("page") || "0", 10);
        const size = parseInt(sp.get("size") || "20", 10);
        const keyword = sp.get("q") || undefined;
        const minPrice = sp.get("min") ? Number(sp.get("min")) : undefined;
        const maxPrice = sp.get("max") ? Number(sp.get("max")) : undefined;
        const sort = sp.get("sort") || "createdAt,desc";
        const catId = sp.get("catId") || undefined;
        return { page, size, keyword, minPrice, maxPrice, sort, catId };
    }, [sp]);

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["search", params],
        queryFn: () => searchProducts(params),
        keepPreviousData: true,
        staleTime: 30_000,
    });

    const onPageChange = (p: number) => {
        const next = new URLSearchParams(sp);
        next.set("page", String(p));
        setSp(next, { replace: false });
    };

    return (
        <main className="page py-6 space-y-4">
            <FiltersBar />

            {isLoading ? (
                <section className="card p-4 md:p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {Array.from({ length: params.size || 20 }).map((_, i) => (
                            <div key={i} className="card p-3 h-64 animate-pulse" />
                        ))}
                    </div>
                </section>
            ) : isError ? (
                <div className="text-red-600">搜索失败：{(error as Error)?.message}</div>
            ) : (
                <section className="card p-4 md:p-6">
                    <div className="text-sm text-gray-600 mb-3">
                        共 <b>{data?.totalElements ?? 0}</b> 件相关商品
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {data?.content.map((p) => <ProductCard key={p.id} p={p} />)}
                    </div>

                    <Paginator
                        page={data?.number || 0}
                        totalPages={data?.totalPages || 1}
                        onPageChange={onPageChange}
                    />
                </section>
            )}
        </main>
    );
}
