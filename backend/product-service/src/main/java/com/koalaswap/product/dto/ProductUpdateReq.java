// ===============================
// backend/product-service/src/main/java/com/koalaswap/product/dto/ProductUpdateReq.java
// DTO｜修改商品请求体（可选字段；图片全量替换）
// ===============================
package com.koalaswap.product.dto;

import com.koalaswap.product.model.Condition;
import jakarta.validation.constraints.*;
import com.koalaswap.product.model.ProductStatus;

import java.math.BigDecimal;
import java.util.List;

/**
 * 修改商品请求参数（部分更新）
 * - null 表示不修改该字段
 * - images 若传入则采用“全量替换”策略
 */
public record ProductUpdateReq(
        @Size(max = 200) String title,
        @Size(max = 5000) String description,
        @DecimalMin("0.01") BigDecimal price,
        @Size(max = 10) String currency,
        Integer categoryId,
        Condition condition,
        Boolean freeShipping,
        @Size(max = 10) List<@NotBlank String> images,
        ProductStatus status
) {}
