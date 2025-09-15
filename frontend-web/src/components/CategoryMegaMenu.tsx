// src/components/CategoryMegaMenu.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCategoryTree, fetchChildCategories, type CategoryRes } from "../api/categories";

interface CategoryMegaMenuProps {
  className?: string;
}

export function CategoryMegaMenu({ className = "" }: CategoryMegaMenuProps) {
  const nav = useNavigate();
  const [categories, setCategories] = useState<CategoryRes[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
  const [subCategories, setSubCategories] = useState<{ [key: number]: CategoryRes[] }>({});

  // 加载顶级分类
  useEffect(() => {
    fetchCategoryTree()
      .then((data) => {
        // 只取顶级分类，子分类按需加载
        const topLevel = data.filter(cat => cat.parentId === null);
        setCategories(topLevel);
      })
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

  // 鼠标悬停时加载子分类
  const handleCategoryHover = async (categoryId: number) => {
    setHoveredCategory(categoryId);

    // 如果已经加载过，直接返回
    if (subCategories[categoryId]) return;

    try {
      const children = await fetchChildCategories(categoryId);
      setSubCategories(prev => ({
        ...prev,
        [categoryId]: children
      }));
    } catch (err) {
      console.error("加载子分类失败:", err);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCategory(null);
  };

  const navigateToCategory = (categoryId: number) => {
    nav(`/search?catId=${categoryId}`);
  };

  if (loading) {
    return (
      <div className={`bg-white shadow-lg rounded-lg ${className}`}>
        <div className="p-4 text-center text-gray-500">加载分类中...</div>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow-lg rounded-lg ${className}`} onMouseLeave={handleMouseLeave}>
      <div className="flex">
        {/* 左侧一级分类列表 */}
        <div className="w-48 bg-gray-50 border-r">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`px-4 py-3 cursor-pointer transition-colors relative ${
                hoveredCategory === category.id
                  ? 'bg-red-50 text-red-600 border-r-2 border-red-500'
                  : 'hover:bg-gray-100'
              }`}
              onMouseEnter={() => handleCategoryHover(category.id)}
              onClick={() => navigateToCategory(category.id)}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{category.name}</span>
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* 右侧子分类展示区域（高度不再受左侧限制；可超过左侧并内部滚动） */}
        <div className="flex-1 min-h-[400px]">
          {hoveredCategory && subCategories[hoveredCategory] && (
            <div className="p-6 overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-3 gap-6">
                {subCategories[hoveredCategory].map((subCategory) => (
                  <div key={subCategory.id} className="space-y-2">
                    {/* 二级分类标题 */}
                    <h3
                      className="text-sm font-semibold text-gray-800 cursor-pointer hover:text-red-600 pb-1 border-b border-gray-100"
                      onClick={() => navigateToCategory(subCategory.id)}
                    >
                      {subCategory.name}
                    </h3>

                    {/* 三级分类列表 */}
                    <SubCategoryList
                      parentId={subCategory.id}
                      onCategoryClick={navigateToCategory}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 默认状态提示 */}
          {!hoveredCategory && (
            <div className="flex items-center justify-center min-h-[400px] text-gray-400 p-6">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <p className="text-sm">将鼠标悬停在左侧分类上查看更多选项</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 三级分类组件
function SubCategoryList({ parentId, onCategoryClick }: { parentId: number; onCategoryClick: (id: number) => void }) {
  const [subCategories, setSubCategories] = useState<CategoryRes[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildCategories(parentId)
      .then(setSubCategories)
      .catch(() => setSubCategories([]))
      .finally(() => setLoading(false));
  }, [parentId]);

  if (loading) {
    return <div className="text-xs text-gray-400">加载中...</div>;
  }

  if (subCategories.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-1">
      {subCategories.slice(0, 8).map((category) => ( // 最多显示8个三级分类
        <li key={category.id}>
          <button
            className="text-xs text-gray-600 hover:text-red-600 transition-colors block w-full text-left py-1"
            onClick={() => onCategoryClick(category.id)}
          >
            {category.name}
          </button>
        </li>
      ))}
      {subCategories.length > 8 && (
        <li>
          <button
            className="text-xs text-red-500 hover:text-red-600 transition-colors"
            onClick={() => onCategoryClick(parentId)}
          >
            查看更多 →
          </button>
        </li>
      )}
    </ul>
  );
}
