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
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/products")
public class ProductController {
    private final ProductService service;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<ProductRes> create(@Valid @RequestBody ProductCreateReq req, Authentication auth) {
        UUID userId = SecuritySupport.requireUserId(auth);
        return ApiResponse.ok(service.create(userId, req));
    }

    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<ProductRes> get(@PathVariable UUID id) {
        return ApiResponse.ok(service.find(id));
    }

    @PatchMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<ProductRes> update(@PathVariable UUID id, @Valid @RequestBody ProductUpdateReq req, Authentication auth) {
        UUID userId = SecuritySupport.requireUserId(auth);
        return ApiResponse.ok(service.update(userId, id, req));
    }

    /** 删除：默认软下架；?hard=true 时执行彻底删除（仅 HIDDEN 允许删除） */
    @DeleteMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<Void> delete(@PathVariable UUID id,
                                    @RequestParam(name = "hard", defaultValue = "false") boolean hard,
                                    Authentication auth) {
        UUID userId = SecuritySupport.requireUserId(auth);
        if (hard) {
            service.hardDelete(userId, id);
        } else {
            service.softHide(userId, id);
        }
        return ApiResponse.ok(null);
    }

    /** 便捷操作：下架 */
    @PostMapping(value = "/{id}/hide", produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<Void> hide(@PathVariable UUID id, Authentication auth) {
        UUID userId = SecuritySupport.requireUserId(auth);
        service.softHide(userId, id);
        return ApiResponse.ok(null);
    }

    /** 便捷操作：重新上架 */
    @PostMapping(value = "/{id}/relist", produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<Void> relist(@PathVariable UUID id, Authentication auth) {
        UUID userId = SecuritySupport.requireUserId(auth);
        service.relist(userId, id);
        return ApiResponse.ok(null);
    }

    /** 查询/搜索/分页（匿名；仅 ACTIVE） */
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
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

    /** 我的发布（需要登录）：tab=onsale(默认) | hidden */
    @GetMapping(value = "/mine", produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<Page<ProductRes>> mine(
            @RequestParam(defaultValue = "onsale") String tab,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            Authentication auth
    ) {
        UUID userId = SecuritySupport.requireUserId(auth);
        return ApiResponse.ok(service.listMine(userId, tab, page, size, sort));
    }
}
