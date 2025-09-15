import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { fetchTopCategories, type CategoryRes } from "../api/categories";

export function CategoryChips() {
  const nav = useNavigate();
  const [categories, setCategories] = useState<CategoryRes[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopCategories()
      .then(setCategories)
      .catch((err) => {
        console.error("加载分类失败:", err);
        // 失败时使用默认分类
        setCategories([
          { id: 1000, name: "数码电子", parentId: null, children: [] },
          { id: 2000, name: "生活用品", parentId: null, children: [] },
          { id: 3000, name: "图书文娱", parentId: null, children: [] },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex gap-2 overflow-auto no-scrollbar py-1">
          <div className="chip chip-secondary animate-pulse shrink-0">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex gap-2 overflow-auto no-scrollbar py-1">
        {categories.map((c) => (
          <button
            key={c.id}
            className="chip chip-secondary hover:brightness-95 shrink-0"
            onClick={() => nav(`/search?catId=${encodeURIComponent(c.id.toString())}`)}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}

