// ===============================
// backend/product-service/src/main/java/com/koalaswap/product/repository/ProductImageRepository.java
// 仓库｜图片查询 & 清空（按 sort_order 升序）
// ===============================
package com.koalaswap.product.repository;

import com.koalaswap.product.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;
import java.util.Optional;

public interface ProductImageRepository extends JpaRepository<ProductImage, UUID> {

    List<ProductImage> findByProductIdOrderBySortOrderAsc(UUID productId);

    Optional<ProductImage> findFirstByProductIdOrderBySortOrderAsc(UUID productId);

    /** 全量替换前，先删除旧图；放在 Service 的事务中使用 */
    @Modifying
    @Query("delete from ProductImage i where i.productId = :pid")
    void deleteByProductId(@Param("pid") UUID productId);
}
