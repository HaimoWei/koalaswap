// ===============================
// backend/product-service/src/main/java/com/koalaswap/product/dto/ProductCreateReq.java
// DTO｜发布商品请求体（参数校验）
// ===============================
package com.koalaswap.product.dto;

import com.koalaswap.product.model.Condition;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * 发布商品请求参数
 * - 价格 > 0
 * - 图片最多 5 张（URL 占位，后续可切预签名直传）
 */
public record ProductCreateReq(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 5000) String description,
        @NotNull @DecimalMin("0.01") BigDecimal price,
        @NotBlank @Size(max = 10) String currency,
        Integer categoryId,
        @NotNull Condition condition,
        @Size(max = 10) List<@NotBlank String> images,
        Boolean freeShipping
) {}
