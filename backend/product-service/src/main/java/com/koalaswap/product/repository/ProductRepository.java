package com.koalaswap.product.repository;

import com.koalaswap.product.entity.Product;
import java.math.BigDecimal;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    /** 搜索分页（仅 active=true；关键字匹配 title/description，价格/分类可选；可排除本人） */
    @Query("""
        select p from Product p
        where p.active = true
          and (:kwLike is null
               or lower(p.title) like :kwLike
               or lower(p.description) like :kwLike)
          and (:catId is null or p.categoryId = :catId)
          and (:minPrice is null or p.price >= :minPrice)
          and (:maxPrice is null or p.price <= :maxPrice)
          and (:excludeSellerId is null or p.sellerId <> :excludeSellerId)
        """)
    Page<Product> searchByLike(@Param("kwLike") String kwLike,
                               @Param("catId") Integer catId,
                               @Param("minPrice") BigDecimal minPrice,
                               @Param("maxPrice") BigDecimal maxPrice,
                               @Param("excludeSellerId") UUID excludeSellerId,
                               Pageable pageable);

    /** 首页专用（仅 active=true + 可选排除本人） */
    @Query("""
        select p from Product p
        where p.active = true
          and (:excludeSellerId is null or p.sellerId <> :excludeSellerId)
        """)
    Page<Product> home(@Param("excludeSellerId") UUID excludeSellerId, Pageable pageable);

    /** 我的发布 */
    Page<Product> findBySellerId(UUID sellerId, Pageable pageable);
}
