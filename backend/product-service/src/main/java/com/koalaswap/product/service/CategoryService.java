// ===============================
// backend/product-service/src/main/java/com/koalaswap/product/service/CategoryService.java
// 业务逻辑层｜分类管理服务
// ===============================
package com.koalaswap.product.service;

import com.koalaswap.product.dto.CategoryRes;
import com.koalaswap.product.entity.Category;
import com.koalaswap.product.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 分类管理服务
 */
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    /**
     * 获取所有分类（平铺列表）
     * 用于下拉选择框等简单场景
     */
    public List<CategoryRes> getAllFlat() {
        return categoryRepository.findAllOrderedByHierarchy()
                .stream()
                .map(this::toRes)
                .toList();
    }

    /**
     * 获取分类树结构
     * 用于导航菜单等层级展示场景
     */
    public List<CategoryRes> getCategoryTree() {
        var allCategories = categoryRepository.findAll();

        // 按父ID分组
        Map<Integer, List<Category>> categoryMap = allCategories.stream()
                .collect(Collectors.groupingBy(
                    c -> c.getParentId() == null ? -1 : c.getParentId()
                ));

        // 构建树结构
        return buildCategoryTree(categoryMap.getOrDefault(-1, List.of()), categoryMap);
    }

    /**
     * 获取顶级分类
     */
    public List<CategoryRes> getTopLevelCategories() {
        return categoryRepository.findByParentIdIsNullOrderById()
                .stream()
                .map(this::toRes)
                .toList();
    }

    /**
     * 获取指定分类的子分类
     */
    public List<CategoryRes> getChildCategories(Integer parentId) {
        return categoryRepository.findByParentIdOrderById(parentId)
                .stream()
                .map(this::toRes)
                .toList();
    }

    /**
     * 获取分类详情
     */
    public CategoryRes getCategory(Integer id) {
        var category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("分类不存在: " + id));
        return toRes(category);
    }

    /**
     * 检查分类是否存在
     */
    public boolean exists(Integer id) {
        return categoryRepository.existsById(id);
    }

    // ---------- 私有方法 ----------

    /**
     * 递归构建分类树
     */
    private List<CategoryRes> buildCategoryTree(List<Category> categories, Map<Integer, List<Category>> categoryMap) {
        return categories.stream()
                .map(category -> {
                    var children = categoryMap.getOrDefault(category.getId(), List.of());
                    var childrenRes = buildCategoryTree(children, categoryMap);
                    return CategoryRes.withChildren(
                            category.getId(),
                            category.getName(),
                            category.getParentId(),
                            childrenRes
                    );
                })
                .toList();
    }

    /**
     * 实体转响应对象
     */
    private CategoryRes toRes(Category category) {
        return CategoryRes.leaf(
                category.getId(),
                category.getName(),
                category.getParentId()
        );
    }
}