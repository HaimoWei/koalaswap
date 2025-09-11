// backend/product-service/src/main/java/com/koalaswap/product/dto/FavoriteProductCard.java
package com.koalaswap.product.dto;

import com.koalaswap.product.entity.Product;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer"})
public class FavoriteProductCard {

    /** 直接复用实体，最小入侵（你现有的 JPQL 构造保持能用） */
    private Product product;

    /** 收藏时间（用于排序/展示） */
    private Instant favoritedAt;

    /** ✅ 新增：商品首图 URL（用于前端卡片图片） */
    private String firstImageUrl;

    /** 仓库 JPQL 用到的那个构造（保持不变） */
    public FavoriteProductCard(Product product, Instant favoritedAt) {
        this.product = product;
        this.favoritedAt = favoritedAt;
    }
}
