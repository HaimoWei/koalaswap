package com.koalaswap.product.controller.internal;

import com.koalaswap.common.dto.ApiResponse;
import com.koalaswap.product.entity.Product;
import com.koalaswap.product.model.ProductStatus;
import com.koalaswap.product.repository.ProductRepository;
import com.koalaswap.product.service.ProductInternalService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/api/internal/products")
@RequiredArgsConstructor
public class ProductInternalController {

    private final ProductRepository products;
    private final ProductInternalService internal;

    /** 提供下单所需字段（含状态） */
    @GetMapping("/{id}/brief")
    public ApiResponse<ProductBrief> brief(@PathVariable UUID id) {
        Product p = products.findById(id).orElse(null);
        if (p == null) return ApiResponse.ok(null);
        return ApiResponse.ok(new ProductBrief(
                p.getId(), p.getSellerId(), p.getTitle(), p.getPrice(), p.getCurrency(), p.getStatus()
        ));
    }

    /** 占用（ACTIVE -> RESERVED） */
    @PostMapping("/{id}/reserve")
    public ApiResponse<Boolean> reserve(@PathVariable UUID id) {
        return ApiResponse.ok(internal.reserve(id));
    }

    /** 释放（RESERVED -> ACTIVE） */
    @PostMapping("/{id}/release")
    public ApiResponse<Boolean> release(@PathVariable UUID id) {
        return ApiResponse.ok(internal.release(id));
    }

    /** 标记售出（-> SOLD） */
    @PostMapping("/{id}/sold")
    public ApiResponse<Boolean> markSold(@PathVariable UUID id) {
        return ApiResponse.ok(internal.markSold(id));
    }

    // 供内部调用的轻量模型
    public record ProductBrief(
            UUID id, UUID sellerId, String title, BigDecimal price, String currency, ProductStatus status
    ) {}
}
