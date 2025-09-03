// backend/product-service/src/main/java/com/koalaswap/product/service/FavoriteService.java
package com.koalaswap.product.service;

import com.koalaswap.product.entity.Favorite;
import com.koalaswap.product.repository.FavoriteRepository;
import com.koalaswap.product.repository.ProductRepository;
import com.koalaswap.product.repository.ProductImageRepository;
import com.koalaswap.product.dto.FavoriteProductCard;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favorites;
    private final ProductRepository products;
    private final ProductImageRepository images;

    @Transactional
    public boolean add(UUID userId, UUID productId) {
        var p = products.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("商品不存在"));
        if (userId.equals(p.getSellerId())) {
            throw new IllegalArgumentException("不能收藏自己的商品");
        }
        if (favorites.existsByIdUserIdAndIdProductId(userId, productId)) return true;

        var id = new Favorite.FavoriteId(userId, productId);
        var fav = Favorite.builder().id(id).createdAt(Instant.now()).build();
        favorites.save(fav);
        return true;
    }

    @Transactional
    public boolean remove(UUID userId, UUID productId) {
        favorites.deleteByIdUserIdAndIdProductId(userId, productId);
        return true;
    }

    public boolean isFavorited(UUID userId, UUID productId) {
        return favorites.existsByIdUserIdAndIdProductId(userId, productId);
    }

    /** 我收藏的商品分页（补 firstImageUrl） */
    public Page<FavoriteProductCard> myFavoriteCards(UUID userId, Pageable pageable) {
        Pageable effective = pageable.getSort().isUnsorted()
                ? PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, "createdAt"))
                : pageable;

        Page<FavoriteProductCard> page = favorites.findCardsByUserId(userId, effective);

        return page.map(card -> {
            var pid = card.getProduct() != null ? card.getProduct().getId() : null;
            if (pid != null) {
                String first = images.findFirstByProductIdOrderBySortOrderAsc(pid)
                        .map(img -> img.getUrl())
                        .orElse(null);
                card.setFirstImageUrl(first);
            }
            return card;
        });
    }

    /** 当前用户的收藏总数 */
    public long countMine(UUID userId) {
        return favorites.countByIdUserId(userId);
    }

    // （如果以后要统计“某商品被多少人收藏”，可以继续保留）
    public long countForProduct(UUID productId) {
        return favorites.countByIdProductId(productId);
    }

    // （保留）仅 productId 的分页
    public Page<FavoriteItem> myFavorites(UUID userId, Pageable pageable) {
        var page = favorites.findByIdUserId(userId, pageable);
        var content = page.map(f -> new FavoriteItem(f.getId().getProductId(), f.getCreatedAt()));
        return new PageImpl<>(content.getContent(), page.getPageable(), page.getTotalElements());
    }

    public record FavoriteItem(UUID productId, Instant favoritedAt) {}
}
