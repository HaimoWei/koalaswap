package com.koalaswap.product.repository;

import com.koalaswap.product.entity.Favorite;
import com.koalaswap.product.entity.Favorite.FavoriteId;
import com.koalaswap.product.dto.FavoriteProductCard;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;

import java.util.UUID;

public interface FavoriteRepository extends JpaRepository<Favorite, FavoriteId> {

    boolean existsByIdUserIdAndIdProductId(UUID userId, UUID productId);

    long deleteByIdUserIdAndIdProductId(UUID userId, UUID productId);

    Page<Favorite> findByIdUserId(UUID userId, Pageable pageable);

    long countByIdProductId(UUID productId);

    @Query(
            value = """
            select new com.koalaswap.product.dto.FavoriteProductCard(p, f.createdAt)
            from Favorite f
            join Product p on p.id = f.id.productId
            where f.id.userId = :userId
            """,
            countQuery = """
            select count(f)
            from Favorite f
            where f.id.userId = :userId
            """
    )
    Page<FavoriteProductCard> findCardsByUserId(UUID userId, Pageable pageable);
}
