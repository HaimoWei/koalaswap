// ===============================
// backend/product-service/src/main/java/com/koalaswap/product/controller/ProductController.java
// 控制器｜发布（需登录）＋ 详情（匿名）＋ 修改/软删（仅作者）＋ 查询分页（匿名）
// ===============================
package com.koalaswap.product.controller;

import com.koalaswap.common.dto.ApiResponse;
import com.koalaswap.common.security.SecuritySupport;
import com.koalaswap.product.dto.ProductCreateReq;
import com.koalaswap.product.dto.ProductRes;
import com.koalaswap.product.dto.ProductUpdateReq;
import com.koalaswap.product.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;

import java.math.BigDecimal;
import java.util.UUID;
import jakarta.servlet.http.HttpServletRequest;


/**
 * 商品接口（MVP）
 * - POST   /api/products                    发布（需要登录）
 * - GET    /api/products/{id}               详情（匿名）
 * - PATCH  /api/products/{id}               修改（仅作者）
 * - DELETE /api/products/{id}               软删（仅作者）
 * - GET    /api/products?kw=&catId=...      查询/搜索/分页（匿名；仅 active=true）
 */
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService service;

    /** 发布商品（从 JWT 取 userId 作为 sellerId） */
    @PostMapping
    public ApiResponse<ProductRes> create(@Valid @RequestBody ProductCreateReq req,
                                          Authentication auth) {
        UUID userId = SecuritySupport.requireUserId(auth);
        return ApiResponse.ok(service.create(userId, req));
    }

    /** 商品详情 */
    @GetMapping("/{id}")
    public ApiResponse<ProductRes> get(@PathVariable UUID id) {
        return ApiResponse.ok(service.find(id));
    }

    /** 修改商品（仅作者） */
    @PatchMapping("/{id}")
    public ApiResponse<ProductRes> update(@PathVariable UUID id,
                                          @Valid @RequestBody ProductUpdateReq req,
                                          Authentication auth) {
        UUID userId = SecuritySupport.requireUserId(auth);
        return ApiResponse.ok(service.update(userId, id, req));
    }

    /** 软删除（仅作者） */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable UUID id, Authentication auth) {
        UUID userId = SecuritySupport.requireUserId(auth);
        service.softDelete(userId, id);
        return ApiResponse.ok(null);
    }

    /** 查询/搜索/分页（匿名；仅 active=true） */
    @GetMapping
    public ApiResponse<Page<ProductRes>> search(
            @RequestParam(required = false) String kw,
            @RequestParam(required = false) Integer catId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort
    ) {
        return ApiResponse.ok(service.search(kw, catId, minPrice, maxPrice, page, size, sort));
    }


}
