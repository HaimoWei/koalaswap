// src/components/TaobaoStyleNavigation.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTopCategories, fetchChildCategories, type CategoryRes } from "../api/categories";

interface TaobaoStyleNavigationProps {
  className?: string;
}

export function TaobaoStyleNavigation({ className = "" }: TaobaoStyleNavigationProps) {
  const nav = useNavigate();
  const [categories, setCategories] = useState<CategoryRes[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
  const [subCategories, setSubCategories] = useState<{ [key: number]: CategoryRes[] }>({});
  const [subSubCategories, setSubSubCategories] = useState<{ [key: number]: CategoryRes[] }>({});

  // 加载顶级分类
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
          { id: 9000, name: "其他分类", parentId: null, children: [] },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  // 鼠标悬停时加载子分类
  const handleCategoryHover = async (categoryId: number) => {
    setHoveredCategory(categoryId);

    // 如果已经加载过二级分类，直接返回
    if (subCategories[categoryId]) {
      return;
    }

    try {
      const children = await fetchChildCategories(categoryId);
      setSubCategories(prev => ({
        ...prev,
        [categoryId]: children
      }));

      // 同时加载每个二级分类的三级分类
      for (const child of children.slice(0, 12)) { // 加载前12个二级分类的三级分类
        try {
          const grandChildren = await fetchChildCategories(child.id);
          setSubSubCategories(prev => ({
            ...prev,
            [child.id]: grandChildren
          }));
        } catch (err) {
          console.error("加载三级分类失败:", err);
        }
      }
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
      <div className={`w-48 bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
        <div className="p-4 text-center text-gray-500">
          <div className="animate-pulse">加载分类中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} onMouseLeave={handleMouseLeave}>
      {/* 左侧分类菜单 */}
      <div className="w-64 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden shadow-sm h-full">
        <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-gray-800 px-4 py-2">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="text-sm font-medium">全部商品分类</span>
          </div>
        </div>

        <div className="divide-y divide-gray-100 overflow-y-auto bg-white" style={{height: 'calc(100% - 2.5rem)'}}>
          {categories.map((category, index) => (
            <div
              key={category.id}
              className={`px-4 py-2.5 cursor-pointer transition-colors relative group ${
                hoveredCategory === category.id
                  ? 'bg-orange-50 text-orange-700'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
              onMouseEnter={() => handleCategoryHover(category.id)}
              onClick={() => navigateToCategory(category.id)}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm">{category.name}</span>
                <svg
                  className={`w-3 h-3 transition-colors ${
                    hoveredCategory === category.id ? 'text-orange-500' : 'text-gray-400'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* 悬浮指示条 */}
              {hoveredCategory === category.id && (
                <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-orange-500"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 右侧多级分类悬浮层（允许高度超过左侧；内部滚动） */}
      {hoveredCategory && (
        <div className="absolute left-64 top-0 bg-white shadow-xl border border-gray-200 z-50 w-[800px] max-h-[80vh] min-h-[20rem] overflow-y-auto rounded-r-xl">
          <div className="p-6">
            {subCategories[hoveredCategory] ? (
              <>
                {/* 分类标题 */}
                <div className="mb-6 pb-3 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {categories.find(c => c.id === hoveredCategory)?.name} 分类
                  </h2>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {subCategories[hoveredCategory].slice(0, 12).map((subCategory) => (
                    <div key={subCategory.id} className="bg-gray-50 rounded-lg p-4 hover:bg-blue-50 hover:shadow-md transition-all duration-200">
                      {/* 二级分类标题 */}
                      <h3
                        className="text-base font-semibold text-gray-800 cursor-pointer hover:text-orange-600 mb-3 flex items-center"
                        onClick={() => navigateToCategory(subCategory.id)}
                      >
                        <span className="w-1 h-4 bg-orange-500 rounded-full mr-2"></span>
                        {subCategory.name}
                      </h3>

                      {/* 三级分类列表 */}
                      {subSubCategories[subCategory.id] && (
                        <div className="space-y-2">
                          {subSubCategories[subCategory.id].slice(0, 5).map((subSubCategory) => (
                            <button
                              key={subSubCategory.id}
                              className="block text-sm text-gray-600 hover:text-orange-600 hover:bg-white transition-all duration-150 w-full text-left py-1 px-2 rounded-md"
                              onClick={() => navigateToCategory(subSubCategory.id)}
                            >
                              • {subSubCategory.name}
                            </button>
                          ))}
                          {subSubCategories[subCategory.id].length > 5 && (
                            <button
                              className="text-sm text-orange-600 hover:text-orange-700 transition-colors mt-2 flex items-center"
                              onClick={() => navigateToCategory(subCategory.id)}
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                              </svg>
                              查看更多
                            </button>
                          )}
                        </div>
                      )}

                      {/* 如果没有三级分类，显示查看全部 */}
                      {!subSubCategories[subCategory.id] && (
                        <button
                          className="text-sm text-gray-500 hover:text-orange-600 transition-colors mt-2 flex items-center"
                          onClick={() => navigateToCategory(subCategory.id)}
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                          查看全部
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* 查看更多按钮 */}
                {subCategories[hoveredCategory].length > 12 && (
                  <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                    <button
                      className="inline-flex items-center px-6 py-3 bg-orange-50 hover:bg-orange-100 text-orange-700 hover:text-orange-800 rounded-lg font-medium transition-all duration-200"
                      onClick={() => navigateToCategory(hoveredCategory)}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      查看 {categories.find(c => c.id === hoveredCategory)?.name} 全部分类
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-40">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-red-200 border-t-red-500 rounded-full mx-auto mb-4"></div>
                  <div className="text-gray-500">正在加载分类...</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
