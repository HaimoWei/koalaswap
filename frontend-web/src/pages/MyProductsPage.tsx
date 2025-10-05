// src/pages/MyProductsPage.tsx
import { useSearchParams, Link } from "react-router-dom";
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
            {/* 顶部：标题 + 右侧发布按钮（圆润样式） */}
            <div className="flex items-center justify-between mb-2">
                <h1 className="text-xl font-semibold text-gray-900">我发布的商品</h1>
                <Link
                  to="/publish"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary)] text-black shadow hover:brightness-105 transition-colors text-sm"
                  title="发布闲置"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  发布闲置
                </Link>
            </div>

            {/* 次级：在售/隐藏 切换（分段控件样式） */}
            <div className="mb-6">
                <div className="inline-flex p-1 rounded-full bg-gray-100 border border-gray-200">
                    <button
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                            tab === "onsale"
                                ? "bg-white text-gray-900 shadow"
                                : "text-gray-600 hover:text-gray-800"
                        }`}
                        onClick={() => setTab("onsale")}
                    >
                        在售 {tab === "onsale" && `(${data?.totalElements || 0})`}
                    </button>
                    <button
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                            tab === "hidden"
                                ? "bg-white text-gray-900 shadow"
                                : "text-gray-600 hover:text-gray-800"
                        }`}
                        onClick={() => setTab("hidden")}
                    >
                        隐藏 {tab === "hidden" && `(${data?.totalElements || 0})`}
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {Array.from({ length: size }).map((_, i) => (
                        <div key={i} className="card p-3 h-64 animate-pulse" />
                    ))}
                </div>
            ) : isError ? (
                <div className="text-red-600">加载失败：{(error as Error)?.message}</div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
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
