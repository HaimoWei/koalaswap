// ===============================
// backend/product-service/src/main/java/com/koalaswap/product/controller/CategoryController.java
// API控制器｜分类相关接口
// ===============================
package com.koalaswap.product.controller;

import com.koalaswap.common.dto.ApiResponse;
import com.koalaswap.product.dto.CategoryRes;
import com.koalaswap.product.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 分类管理API
 * - 提供分类查询接口
 * - 支持平铺和树形两种数据格式
 */
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    /**
     * 获取所有分类（平铺列表）
     * GET /api/categories?format=flat
     *
     * 用途：下拉选择框、筛选条件等
     * 返回：按层级排序的平铺列表
     */
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<List<CategoryRes>> getCategories(
            @RequestParam(defaultValue = "flat") String format
    ) {
        if ("tree".equals(format)) {
            return ApiResponse.ok(categoryService.getCategoryTree());
        }
        return ApiResponse.ok(categoryService.getAllFlat());
    }

    /**
     * 获取分类树结构
     * GET /api/categories/tree
     *
     * 用途：导航菜单、分类选择器等
     * 返回：嵌套的树形结构
     */
    @GetMapping(value = "/tree", produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<List<CategoryRes>> getCategoryTree() {
        return ApiResponse.ok(categoryService.getCategoryTree());
    }

    /**
     * 获取顶级分类
     * GET /api/categories/top
     *
     * 用途：首页分类导航等
     * 返回：所有一级分类
     */
    @GetMapping(value = "/top", produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<List<CategoryRes>> getTopLevelCategories() {
        return ApiResponse.ok(categoryService.getTopLevelCategories());
    }

    /**
     * 获取指定分类的子分类
     * GET /api/categories/{parentId}/children
     *
     * 用途：级联选择器、动态加载子分类等
     * 参数：parentId - 父分类ID
     *
     * 注意：这个路径要放在 /{id} 之前，避免路径冲突
     */
    @GetMapping(value = "/{parentId}/children", produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<List<CategoryRes>> getChildCategories(@PathVariable Integer parentId) {
        return ApiResponse.ok(categoryService.getChildCategories(parentId));
    }

    /**
     * 获取分类详情
     * GET /api/categories/{id}
     *
     * 用途：分类信息展示
     * 参数：id - 分类ID
     */
    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<CategoryRes> getCategory(@PathVariable Integer id) {
        return ApiResponse.ok(categoryService.getCategory(id));
    }
}