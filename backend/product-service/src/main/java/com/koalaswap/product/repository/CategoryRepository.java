// ===============================
// backend/product-service/src/main/java/com/koalaswap/product/repository/CategoryRepository.java
// 数据访问层｜分类查询接口
// ===============================
package com.koalaswap.product.repository;

import com.koalaswap.product.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 分类数据访问接口
 */
@Repository
public interface CategoryRepository extends JpaRepository<Category, Integer> {

    /**
     * 查询顶级分类（parent_id 为 NULL）
     */
    List<Category> findByParentIdIsNullOrderById();

    /**
     * 查询指定父分类的所有子分类
     */
    List<Category> findByParentIdOrderById(Integer parentId);

    /**
     * 查询所有分类，按层级和ID排序
     */
    @Query("SELECT c FROM Category c ORDER BY " +
           "CASE WHEN c.parentId IS NULL THEN c.id ELSE c.parentId END, " +
           "c.parentId NULLS FIRST, c.id")
    List<Category> findAllOrderedByHierarchy();

    /**
     * 检查分类是否存在子分类
     */
    boolean existsByParentId(Integer parentId);
}