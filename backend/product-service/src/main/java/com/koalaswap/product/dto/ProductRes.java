// ===============================
// backend/product-service/src/main/java/com/koalaswap/product/dto/ProductRes.java
// DTO｜对外返回视图（隐藏内部细节）
// ===============================
package com.koalaswap.product.dto;

import com.koalaswap.product.model.Condition;
import com.koalaswap.product.model.ProductStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** 商品返回模型（给前端使用） */
public record ProductRes(
        UUID id,
        UUID sellerId,
        String title,
        String description,
        BigDecimal price,
        String currency,
        Integer categoryId,
        Condition condition,
        ProductStatus status,
        Instant createdAt,
        Instant updatedAt,
        List<String> images
) {}