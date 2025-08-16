// backend/product-service/src/main/java/com/koalaswap/product/controller/ProductController.java
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
import org.springframework.http.HttpMethod;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService service;

    @PostMapping
    public ApiResponse<ProductRes> create(@Valid @RequestBody ProductCreateReq req, Authentication auth) {
        UUID userId = SecuritySupport.requireUserId(auth);
        return ApiResponse.ok(service.create(userId, req));
    }

    @GetMapping("/{id}")
    public ApiResponse<ProductRes> get(@PathVariable UUID id) {
        return ApiResponse.ok(service.find(id));
    }

    @PatchMapping("/{id}")
    public ApiResponse<ProductRes> update(@PathVariable UUID id, @Valid @RequestBody ProductUpdateReq req, Authentication auth) {
        UUID userId = SecuritySupport.requireUserId(auth);
        return ApiResponse.ok(service.update(userId, id, req));
    }

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
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @RequestParam(required = false) UUID excludeSellerId
    ) {
        return ApiResponse.ok(service.search(kw, catId, minPrice, maxPrice, page, size, sort, excludeSellerId));
    }

    /** 我的发布（需要登录） */
    @GetMapping("/mine")
    public ApiResponse<Page<ProductRes>> mine(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            Authentication auth
    ) {
        UUID userId = SecuritySupport.requireUserId(auth);
        return ApiResponse.ok(service.listMine(userId, page, size, sort));
    }
}
