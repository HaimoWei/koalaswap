package com.koalaswap.product.dto;

import com.koalaswap.product.entity.Product;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

import java.time.Instant;

/**
 * 收藏的商品卡片：
 *  - product: 直接复用你现有的 Product 实体（最小改动，不新造 DTO 依赖链）
 *  - favoritedAt: 收藏时间（用于排序/展示）
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer"})
public class FavoriteProductCard {

    private Product product;

    private Instant favoritedAt;
}
