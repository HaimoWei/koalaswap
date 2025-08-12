// ===============================
// backend/product-service/src/main/java/com/koalaswap/product/repository/ProductRepository.java
// 仓库｜主表 CRUD + 搜索（分页/排序）
// ===============================
package com.koalaswap.product.repository;

import com.koalaswap.product.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    /**
     * 搜索（最小实现）
     * - 仅返回 active=true 的商品
     * - 关键字在 title/description 上做大小写不敏感匹配
     * - 分类与价格区间可选
     */
        @Query("""
      select p from Product p
      where p.active = true
        and (:kwLike is null or (
             lower(p.title)       like :kwLike
          or lower(p.description) like :kwLike
        ))
        and (:catId   is null or p.categoryId = :catId)
        and (:minPrice is null or p.price >= :minPrice)
        and (:maxPrice is null or p.price <= :maxPrice)
    """)
        Page<Product> searchByLike(
                @Param("kwLike") String kwLike,
                @Param("catId") Integer catId,
                @Param("minPrice") BigDecimal minPrice,
                @Param("maxPrice") BigDecimal maxPrice,
                Pageable pageable
        );

}
