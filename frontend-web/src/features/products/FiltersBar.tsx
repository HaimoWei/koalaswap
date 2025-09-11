import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// 顶部筛选条（关键词 / 价格区间 / 排序）
// 类目 catId 后续若有接口可补充下拉（当前保留参数占位）
export function FiltersBar() {
    const nav = useNavigate();
    const [sp] = useSearchParams();

    // 从 URL 初始化状态（保持地址栏与 UI 同步）
    const [keyword, setKeyword] = useState(sp.get("q") || "");
    const [minPrice, setMinPrice] = useState(sp.get("min") || "");
    const [maxPrice, setMaxPrice] = useState(sp.get("max") || "");
    const [sort, setSort] = useState(sp.get("sort") || "createdAt,desc");

    useEffect(() => {
        setKeyword(sp.get("q") || "");
        setMinPrice(sp.get("min") || "");
        setMaxPrice(sp.get("max") || "");
        setSort(sp.get("sort") || "createdAt,desc");
    }, [sp]);

    function submit(page = 0) {
        const params = new URLSearchParams();
        if (keyword) params.set("q", keyword);
        if (minPrice) params.set("min", minPrice);
        if (maxPrice) params.set("max", maxPrice);
        if (sort) params.set("sort", sort);
        params.set("page", String(page));
        nav(`/search?${params.toString()}`);
    }

    return (
        <div className="flex flex-col md:flex-row gap-3 md:items-end bg-white border p-3 rounded-lg">
            <div className="flex-1">
                <label className="block text-xs text-gray-500">关键词</label>
                <input
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="手机 / 显卡 / Switch ..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submit(0)}
                />
            </div>

            <div>
                <label className="block text-xs text-gray-500">最低价</label>
                <input
                    className="w-32 border rounded px-3 py-2 text-sm"
                    placeholder="min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                />
            </div>

            <div>
                <label className="block text-xs text-gray-500">最高价</label>
                <input
                    className="w-32 border rounded px-3 py-2 text-sm"
                    placeholder="max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                />
            </div>

            <div>
                <label className="block text-xs text-gray-500">排序</label>
                <select
                    className="w-48 border rounded px-3 py-2 text-sm"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                >
                    <option value="createdAt,desc">最新发布</option>
                    <option value="price,asc">价格从低到高</option>
                    <option value="price,desc">价格从高到低</option>
                </select>
            </div>

            <button
                onClick={() => submit(0)}
                className="md:ml-auto px-4 py-2 rounded bg-black text-white text-sm"
            >
                搜索
            </button>
        </div>
    );
}
