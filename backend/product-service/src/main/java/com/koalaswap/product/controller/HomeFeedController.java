package com.koalaswap.product.controller;

import com.koalaswap.common.dto.ApiResponse;
import com.koalaswap.common.security.SecuritySupport;
import com.koalaswap.product.dto.ProductRes;
import com.koalaswap.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class HomeFeedController {

    private final ProductService service;

    /** 首页：全部 active 商品，默认按 createdAt,desc；登录则排除本人的商品 */
    @GetMapping("/home")
    public ApiResponse<Page<ProductRes>> home(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            Authentication auth
    ) {
        var excludeId = SecuritySupport.currentUserIdOrNull(auth);
        return ApiResponse.ok(service.home(excludeId, page, size, sort));
    }
}
