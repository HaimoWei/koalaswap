// ===============================
// backend/product-service/src/main/java/com/koalaswap/product/repository/ProductImageRepository.java
// 仓库｜图片查询（按 sort_order 升序）
// ===============================
package com.koalaswap.product.repository;

import com.koalaswap.product.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProductImageRepository extends JpaRepository<ProductImage, UUID> {
    List<ProductImage> findByProductIdOrderBySortOrderAsc(UUID productId);
}
