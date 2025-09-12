// src/pages/MyProductsPage.tsx
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchMyProducts } from "../api/products";
import { ProductCard } from "../components/ProductCard";
import { Paginator } from "../components/Paginator";
import type { Page, ProductRes } from "../api/types";

export function MyProductsPage() {
    const [sp, setSp] = useSearchParams();
    const tab = (sp.get("tab") as "onsale" | "hidden") || "onsale";
    const page = parseInt(sp.get("page") || "0", 10);
    const size = parseInt(sp.get("size") || "20", 10);

    const { data, isLoading, isError, error } = useQuery<Page<ProductRes>>({
        queryKey: ["mine", tab, page, size],
        queryFn: () => fetchMyProducts({ tab, page, size, sort: "updatedAt,desc" }),
        // v5: 用 placeholderData 复刻 keepPreviousData 行为
        placeholderData: (prev) => prev,
    });

    const setTab = (t: "onsale" | "hidden") => {
        const next = new URLSearchParams(sp);
        next.set("tab", t);
        next.set("page", "0");
        setSp(next);
    };

    const onPageChange = (p: number) => {
        const next = new URLSearchParams(sp);
        next.set("page", String(p));
        setSp(next);
    };

    return (
        <main className="page py-6">
            <div className="flex gap-2 mb-4">
                <button
                    className={`btn text-sm ${tab === "onsale" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setTab("onsale")}
                >
                    在售
                </button>
                <button
                    className={`btn text-sm ${tab === "hidden" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setTab("hidden")}
                >
                    隐藏
                </button>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                    {Array.from({ length: size }).map((_, i) => (
                        <div key={i} className="card p-3 h-64 animate-pulse" />
                    ))}
                </div>
            ) : isError ? (
                <div className="text-red-600">加载失败：{(error as Error)?.message}</div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {(data?.content ?? []).map((p: ProductRes) => (
                            <ProductCard key={p.id} p={p} />
                        ))}
                    </div>

                    <Paginator
                        page={data?.number ?? 0}
                        totalPages={data?.totalPages ?? 1}
                        onPageChange={onPageChange}
                    />
                </>
            )}
        </main>
    );
}
