// product-service/src/main/java/com/koalaswap/product/repository/ProductRepository.java
package com.koalaswap.product.repository;

import com.koalaswap.product.entity.Product;
import com.koalaswap.product.model.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.Collection;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    // 搜索：仅某状态（通常 ACTIVE），其余过滤条件与原版一致 + 可选 sellerId 过滤
    @Query("""
        select p from Product p
        where p.status = :status
          and (:kwLike is null or lower(p.title) like :kwLike or lower(p.description) like :kwLike)
          and (:catId is null or p.categoryId = :catId)
          and (:minPrice is null or p.price >= :minPrice)
          and (:maxPrice is null or p.price <= :maxPrice)
          and (:excludeSellerId is null or p.sellerId <> :excludeSellerId)
          and (:sellerId is null or p.sellerId = :sellerId)
    """)
    Page<Product> searchByLikeWithStatus(@Param("status") ProductStatus status,
                                         @Param("kwLike") String kwLike,
                                         @Param("catId") Integer catId,
                                         @Param("minPrice") BigDecimal minPrice,
                                         @Param("maxPrice") BigDecimal maxPrice,
                                         @Param("excludeSellerId") UUID excludeSellerId,
                                         @Param("sellerId") UUID sellerId,
                                         Pageable pageable);

    // 旧的默认重载（无 sellerId），保持兼容
    @Deprecated(forRemoval = false, since = "2025-09")
    default Page<Product> searchByLike(String kwLike,
                                       Integer catId,
                                       BigDecimal minPrice,
                                       BigDecimal maxPrice,
                                       UUID excludeSellerId,
                                       Pageable pageable) {
        return searchByLikeWithStatus(ProductStatus.ACTIVE, kwLike, catId, minPrice, maxPrice, excludeSellerId, null, pageable);
    }

    // 新增：带 sellerId 的默认重载（供 service 调用）
    default Page<Product> searchByLike(String kwLike,
                                       Integer catId,
                                       BigDecimal minPrice,
                                       BigDecimal maxPrice,
                                       UUID excludeSellerId,
                                       UUID sellerId,
                                       Pageable pageable) {
        return searchByLikeWithStatus(ProductStatus.ACTIVE, kwLike, catId, minPrice, maxPrice, excludeSellerId, sellerId, pageable);
    }

    // 首页：仅某状态（通常 ACTIVE）
    @Query("""
        select p from Product p
        where p.status = :status
          and (:excludeSellerId is null or p.sellerId <> :excludeSellerId)
    """)
    Page<Product> homeWithStatus(@Param("status") ProductStatus status,
                                 @Param("excludeSellerId") UUID excludeSellerId,
                                 Pageable pageable);

    default Page<Product> home(UUID excludeSellerId, Pageable pageable) {
        return homeWithStatus(ProductStatus.ACTIVE, excludeSellerId, pageable);
    }

    /** 我的发布：排除 SOLD（完成订单的商品不应出现在“我的发布”） */
    Page<Product> findBySellerIdAndStatusNot(UUID sellerId, ProductStatus status, Pageable pageable);

    /** 兼容其它地方可能用到的无过滤方法（不用于“我的发布”） */
    Page<Product> findBySellerId(UUID sellerId, Pageable pageable);

    Page<Product> findBySellerIdAndStatusIn(UUID sellerId, Collection<ProductStatus> statuses, Pageable pageable);

    // ----- 状态切换 -----

    /** 仅当 from 匹配时进行状态切换（用于 RESERVED->ACTIVE 等） */
    @Modifying
    @Transactional
    @Query("update Product p set p.status = :to where p.id = :id and p.status = :from")
    int updateStatusIf(@Param("id") UUID id,
                       @Param("from") ProductStatus from,
                       @Param("to") ProductStatus to);

    /** 将状态切换为目标状态，若已为目标则不更新（用于 markSold / activate） */
    @Modifying
    @Transactional
    @Query("update Product p set p.status = :to where p.id = :id and p.status <> :to")
    int updateStatusUnless(@Param("id") UUID id,
                           @Param("to") ProductStatus to);
}
