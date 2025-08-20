package com.koalaswap.product.service;

import com.koalaswap.product.entity.Favorite;
import com.koalaswap.product.repository.FavoriteRepository;
import com.koalaswap.product.repository.ProductRepository;
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
    private final ProductRepository products; // 新增：用于校验是否自收藏

    /** 添加收藏（若已存在则幂等返回 true） */
    @Transactional
    public boolean add(UUID userId, UUID productId) {
        // 最小规则：禁止收藏自己的商品；并保证商品存在
        var p = products.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("商品不存在"));
        if (userId.equals(p.getSellerId())) {
            throw new IllegalArgumentException("不能收藏自己的商品");
        }

        var exists = favorites.existsByIdUserIdAndIdProductId(userId, productId);
        if (exists) return true;

        var id = new Favorite.FavoriteId(userId, productId);
        var fav = Favorite.builder().id(id).createdAt(Instant.now()).build();
        favorites.save(fav);
        return true;
    }

    /** 取消收藏（若不存在也视为成功） */
    @Transactional
    public boolean remove(UUID userId, UUID productId) {
        favorites.deleteByIdUserIdAndIdProductId(userId, productId);
        return true;
    }

    /** 是否已收藏 */
    public boolean isFavorited(UUID userId, UUID productId) {
        return favorites.existsByIdUserIdAndIdProductId(userId, productId);
    }

    /** 我收藏的商品（返回 Product 卡片 + favoritedAt 的分页） */
    public Page<FavoriteProductCard> myFavoriteCards(UUID userId, Pageable pageable) {
        // 默认按收藏时间倒序；若外部已传排序则尊重外部
        Pageable effective = pageable;
        if (pageable.getSort().isUnsorted()) {
            effective = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                    Sort.by(Sort.Direction.DESC, "createdAt"));
        }
        return favorites.findCardsByUserId(userId, effective);
    }

    /** 某商品被多少人收藏（可选） */
    public long countForProduct(UUID productId) {
        return favorites.countByIdProductId(productId);
    }

    /** （保留）仅 productId 的分页，若其它地方依赖可继续使用 */
    public Page<FavoriteItem> myFavorites(UUID userId, Pageable pageable) {
        var page = favorites.findByIdUserId(userId, pageable);
        var content = page.map(f -> new FavoriteItem(f.getId().getProductId(), f.getCreatedAt()));
        return new PageImpl<>(content.getContent(), page.getPageable(), page.getTotalElements());
    }

    /** 简单返回对象：仅包含 productId + 收藏时间（兼容保留） */
    public record FavoriteItem(UUID productId, Instant favoritedAt) {}
}
