import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchMyProducts } from "../api/products";
import { ProductCard } from "../components/ProductCard";
import { Paginator } from "../components/Paginator";

export function MyProductsPage() {
    const [sp, setSp] = useSearchParams();
    const tab = (sp.get("tab") as "onsale" | "hidden") || "onsale";
    const page = parseInt(sp.get("page") || "0", 10);
    const size = parseInt(sp.get("size") || "20", 10);

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["mine", tab, page, size],
        queryFn: () => fetchMyProducts({ tab, page, size, sort: "updatedAt,desc" }),
        keepPreviousData: true,
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
        <main className="max-w-6xl mx-auto p-6">
            <div className="flex gap-2 mb-4">
                <button
                    className={`px-3 py-1 rounded text-sm ${tab === "onsale" ? "bg-black text-white" : "bg-gray-100"}`}
                    onClick={() => setTab("onsale")}
                >
                    在售
                </button>
                <button
                    className={`px-3 py-1 rounded text-sm ${tab === "hidden" ? "bg-black text-white" : "bg-gray-100"}`}
                    onClick={() => setTab("hidden")}
                >
                    隐藏
                </button>
            </div>

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
                        onPageChange={onPageChange}
                    />
                </>
            )}
        </main>
    );
}
