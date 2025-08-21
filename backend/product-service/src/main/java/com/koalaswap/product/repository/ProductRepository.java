package com.koalaswap.product.repository;

import com.koalaswap.product.entity.Product;
import com.koalaswap.product.model.ProductStatus;
import java.math.BigDecimal;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    // ===== 真正执行查询（参数化 status），避免 Hibernate 内联导致的类型 cast 问题 =====
    @Query("""
        select p from Product p
        where p.status = :status
          and (:kwLike is null
               or lower(p.title) like :kwLike
               or lower(p.description) like :kwLike)
          and (:catId is null or p.categoryId = :catId)
          and (:minPrice is null or p.price >= :minPrice)
          and (:maxPrice is null or p.price <= :maxPrice)
          and (:excludeSellerId is null or p.sellerId <> :excludeSellerId)
        """)
    Page<Product> searchByLikeWithStatus(@Param("status") ProductStatus status,
                                         @Param("kwLike") String kwLike,
                                         @Param("catId") Integer catId,
                                         @Param("minPrice") BigDecimal minPrice,
                                         @Param("maxPrice") BigDecimal maxPrice,
                                         @Param("excludeSellerId") UUID excludeSellerId,
                                         Pageable pageable);

    // ===== 保持你原有方法签名：默认只查 ACTIVE（不要改你 Service 里的调用） =====
    default Page<Product> searchByLike(String kwLike,
                                       Integer catId,
                                       BigDecimal minPrice,
                                       BigDecimal maxPrice,
                                       UUID excludeSellerId,
                                       Pageable pageable) {
        return searchByLikeWithStatus(ProductStatus.ACTIVE, kwLike, catId, minPrice, maxPrice, excludeSellerId, pageable);
    }

    // ===== 首页同理：带 status 的真实方法 + 原签名包装 =====
    @Query("""
        select p from Product p
        where p.status = :status
          and (:excludeSellerId is null or p.sellerId <> :excludeSellerId)
        """)
    Page<Product> homeWithStatus(@Param("status") ProductStatus status,
                                 @Param("excludeSellerId") UUID excludeSellerId,
                                 Pageable pageable);
    /** 我的发布 */
    Page<Product> findBySellerId(UUID sellerId, Pageable pageable);

    default Page<Product> home(UUID excludeSellerId, Pageable pageable) {
        return homeWithStatus(ProductStatus.ACTIVE, excludeSellerId, pageable);
    }

    // ===== 内部状态切换（订单占用/释放/售出用） =====
    @Modifying @Transactional
    @Query("update Product p set p.status = :to where p.id = :id and p.status = :from")
    int updateStatusIf(@Param("id") UUID id,
                       @Param("from") ProductStatus from,
                       @Param("to") ProductStatus to);

    @Modifying @Transactional
    @Query("update Product p set p.status = :to where p.id = :id and p.status <> :to")
    int updateStatusUnless(@Param("id") UUID id,
                           @Param("to") ProductStatus to);
}
