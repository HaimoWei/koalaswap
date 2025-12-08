// src/components/CategoryNavigation.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTopCategories, type CategoryRes } from "../api/categories";
import { CategoryMegaMenu } from "./CategoryMegaMenu";

export function CategoryNavigation() {
  const nav = useNavigate();
  const [categories, setCategories] = useState<CategoryRes[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 检测是否为移动设备
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // 加载分类数据
    fetchTopCategories()
      .then(setCategories)
      .catch((err) => {
        console.error("Failed to load categories:", err);
        setCategories([
          { id: 1000, name: "Electronics", parentId: null, children: [] },
          { id: 2000, name: "Home & living", parentId: null, children: [] },
          { id: 3000, name: "Books & entertainment", parentId: null, children: [] },
        ]);
      })
      .finally(() => setLoading(false));

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleAllCategoriesHover = () => {
    if (!isMobile) {
      setShowMegaMenu(true);
    }
  };

  const handleAllCategoriesClick = () => {
    if (isMobile) {
      setShowMegaMenu(!showMegaMenu);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setShowMegaMenu(false);
    }
  };

  const navigateToCategory = (categoryId: number) => {
    nav(`/search?catId=${categoryId}`);
    setShowMegaMenu(false); // 移动端点击后关闭菜单
  };

  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex gap-2 overflow-auto no-scrollbar py-1">
          <div className="chip chip-secondary animate-pulse shrink-0">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 relative">
      {/* 导航栏 */}
      <div className="flex gap-2 overflow-auto no-scrollbar py-1">
        {/* 全部分类按钮 */}
        <div
          className="relative"
          onMouseEnter={handleAllCategoriesHover}
          onMouseLeave={handleMouseLeave}
        >
          <button
            className={`chip chip-primary hover:brightness-95 shrink-0 flex items-center gap-1 ${
              showMegaMenu ? 'bg-red-600 text-white' : ''
            }`}
            onClick={handleAllCategoriesClick}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            All categories
            <svg className={`w-3 h-3 transition-transform ${showMegaMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Mega Menu */}
          {showMegaMenu && (
            <div className="absolute top-full left-0 z-50 mt-1">
              <CategoryMegaMenu className="w-[600px]" />
            </div>
          )}
        </div>

        {/* 热门分类快捷入口 */}
        {categories.map((category) => (
          <button
            key={category.id}
            className="chip chip-secondary hover:brightness-95 shrink-0"
            onClick={() => navigateToCategory(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* 移动端遮罩层 */}
      {showMegaMenu && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setShowMegaMenu(false)}
        />
      )}

      {/* 移动端全屏Mega Menu */}
      {showMegaMenu && isMobile && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-white z-50 md:hidden overflow-y-auto">
          <div className="p-4">
            {/* 移动端标题栏 */}
            <div className="flex justify-between items-center mb-4 pb-4 border-b">
              <h2 className="text-lg font-semibold">All categories</h2>
              <button
                onClick={() => setShowMegaMenu(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 移动端分类列表 */}
            <MobileCategoryList categories={categories} onCategoryClick={navigateToCategory} />
          </div>
        </div>
      )}
    </div>
  );
}

// 移动端分类列表组件
function MobileCategoryList({ categories, onCategoryClick }: {
  categories: CategoryRes[];
  onCategoryClick: (id: number) => void;
}) {
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

  const toggleCategory = (categoryId: number) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  return (
    <div className="space-y-2">
      {categories.map((category) => (
        <MobileCategoryItem
          key={category.id}
          category={category}
          isExpanded={expandedCategory === category.id}
          onToggle={() => toggleCategory(category.id)}
          onCategoryClick={onCategoryClick}
        />
      ))}
    </div>
  );
}

// 移动端分类项组件
function MobileCategoryItem({
  category,
  isExpanded,
  onToggle,
  onCategoryClick
}: {
  category: CategoryRes;
  isExpanded: boolean;
  onToggle: () => void;
  onCategoryClick: (id: number) => void;
}) {
  const [subCategories, setSubCategories] = useState<CategoryRes[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isExpanded && subCategories.length === 0) {
      setLoading(true);
      // 这里可以调用API加载子分类，暂时模拟
      setTimeout(() => {
        setSubCategories([]);
        setLoading(false);
      }, 500);
    }
  }, [isExpanded, subCategories.length]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* 一级分类 */}
      <div className="flex items-center justify-between p-4 bg-gray-50">
        <button
          className="flex-1 text-left font-medium text-gray-800"
          onClick={() => onCategoryClick(category.id)}
        >
          {category.name}
        </button>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-gray-200 rounded"
        >
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* 子分类 */}
      {isExpanded && (
        <div className="p-4 bg-white">
          {loading ? (
            <div className="text-center text-gray-500 py-4">Loading...</div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              No subcategories
            </div>
          )}
        </div>
      )}
    </div>
  );
}
