// ===============================
// backend/product-service/src/main/java/com/koalaswap/product/dto/CategoryRes.java
// DTO｜分类响应对象
// ===============================
package com.koalaswap.product.dto;

import java.util.List;

/**
 * 分类响应对象
 * - 支持层级结构展示
 * - 包含子分类列表
 */
public record CategoryRes(
        Integer id,
        String name,
        Integer parentId,
        List<CategoryRes> children
) {
    /**
     * 创建叶子节点（无子分类）
     */
    public static CategoryRes leaf(Integer id, String name, Integer parentId) {
        return new CategoryRes(id, name, parentId, List.of());
    }

    /**
     * 创建带子分类的节点
     */
    public static CategoryRes withChildren(Integer id, String name, Integer parentId, List<CategoryRes> children) {
        return new CategoryRes(id, name, parentId, children);
    }
}