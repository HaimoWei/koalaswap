// src/components/TaobaoStyleNavigation.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTopCategories, fetchChildCategories, type CategoryRes } from "../api/categories";
import { translateCategoryName } from "../categoryNames";

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

  // Load top-level categories
  useEffect(() => {
    fetchTopCategories()
      .then(setCategories)
      .catch((err) => {
        console.error("Failed to load categories:", err);
        // Fallback to default categories
        setCategories([
          { id: 1000, name: "Electronics", parentId: null, children: [] },
          { id: 2000, name: "Home & living", parentId: null, children: [] },
          { id: 3000, name: "Books & entertainment", parentId: null, children: [] },
          { id: 9000, name: "Other categories", parentId: null, children: [] },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Load sub-categories on hover
  const handleCategoryHover = async (categoryId: number) => {
    setHoveredCategory(categoryId);

    // If second-level categories already loaded, skip
    if (subCategories[categoryId]) {
      return;
    }

    try {
      const children = await fetchChildCategories(categoryId);
      setSubCategories(prev => ({
        ...prev,
        [categoryId]: children
      }));

      // Also load third-level categories for the first 12 second-level categories
      for (const child of children.slice(0, 12)) {
        try {
          const grandChildren = await fetchChildCategories(child.id);
          setSubSubCategories(prev => ({
            ...prev,
            [child.id]: grandChildren
          }));
        } catch (err) {
          console.error("Failed to load third-level categories:", err);
        }
      }
    } catch (err) {
      console.error("Failed to load child categories:", err);
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
          <div className="animate-pulse">Loading categories...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} onMouseLeave={handleMouseLeave}>
      {/* Left category menu */}
      <div className="w-64 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden shadow-sm h-full">
        <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-gray-800 px-4 py-2">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="text-sm font-medium">All product categories</span>
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
                <span className="text-sm">{translateCategoryName(category.name)}</span>
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

      {/* Right multi-level category hover panel */}
      {hoveredCategory && (
        <div className="absolute left-64 top-0 bg-white shadow-xl border border-gray-200 z-50 w-[800px] max-h-[80vh] min-h-[20rem] overflow-y-auto rounded-r-xl">
          <div className="p-6">
            {subCategories[hoveredCategory] ? (
              <>
                {/* Category title */}
                <div className="mb-6 pb-3 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {translateCategoryName(categories.find(c => c.id === hoveredCategory)?.name ?? "")} categories
                  </h2>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {subCategories[hoveredCategory].slice(0, 12).map((subCategory) => (
                    <div key={subCategory.id} className="bg-gray-50 rounded-lg p-4 hover:bg-blue-50 hover:shadow-md transition-all duration-200">
                      {/* Second-level category title */}
                      <h3
                        className="text-base font-semibold text-gray-800 cursor-pointer hover:text-orange-600 mb-3 flex items-center"
                        onClick={() => navigateToCategory(subCategory.id)}
                      >
                        <span className="w-1 h-4 bg-orange-500 rounded-full mr-2"></span>
                        {translateCategoryName(subCategory.name)}
                      </h3>

                      {/* Third-level category list */}
                      {subSubCategories[subCategory.id] && (
                        <div className="space-y-2">
                          {subSubCategories[subCategory.id].slice(0, 5).map((subSubCategory) => (
                            <button
                              key={subSubCategory.id}
                              className="block text-sm text-gray-600 hover:text-orange-600 hover:bg-white transition-all duration-150 w-full text-left py-1 px-2 rounded-md"
                              onClick={() => navigateToCategory(subSubCategory.id)}
                            >
                              • {translateCategoryName(subSubCategory.name)}
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
                              View more
                            </button>
                          )}
                        </div>
                      )}

                      {/* If there are no third-level categories, show "view all" */}
                      {!subSubCategories[subCategory.id] && (
                        <button
                          className="text-sm text-gray-500 hover:text-orange-600 transition-colors mt-2 flex items-center"
                          onClick={() => navigateToCategory(subCategory.id)}
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                          View all
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* View more button */}
                {subCategories[hoveredCategory].length > 12 && (
                  <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                    <button
                      className="inline-flex items-center px-6 py-3 bg-orange-50 hover:bg-orange-100 text-orange-700 hover:text-orange-800 rounded-lg font-medium transition-all duration-200"
                      onClick={() => navigateToCategory(hoveredCategory)}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      View all categories in {translateCategoryName(categories.find(c => c.id === hoveredCategory)?.name ?? "")}
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
                  <div className="text-gray-500">Loading categories...</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
