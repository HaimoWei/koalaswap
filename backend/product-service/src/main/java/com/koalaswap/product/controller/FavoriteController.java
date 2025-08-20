package com.koalaswap.product.controller;

import com.koalaswap.common.dto.ApiResponse;
import com.koalaswap.product.dto.FavoriteProductCard;
import com.koalaswap.product.service.FavoriteService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;
    private final HttpServletRequest request;

    /** 添加收藏（需要登录） */
    @PostMapping(value = "/{productId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<Boolean> add(@PathVariable UUID productId) {
        var userId = currentUserId();
        var ok = favoriteService.add(userId, productId);
        return ApiResponse.ok(ok);
    }

    /** 取消收藏（需要登录） */
    @DeleteMapping(value = "/{productId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<Boolean> remove(@PathVariable UUID productId) {
        var userId = currentUserId();
        var ok = favoriteService.remove(userId, productId);
        return ApiResponse.ok(ok);
    }

    /**
     * 我收藏的商品（需要登录） - 分页
     * 直接返回商品卡片（包含 Product 明细 + favoritedAt）
     */
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<Page<FavoriteProductCard>> myFavoriteCards(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,DESC") String sort // createdAt,DESC / createdAt,ASC
    ) {
        Sort sortSpec = parseSort(sort);
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), sortSpec);
        var data = favoriteService.myFavoriteCards(currentUserId(), pageable);
        return ApiResponse.ok(data);
    }

    /** 是否已收藏（需要登录） */
    @GetMapping(value = "/check", produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<FavoriteCheckRes> isFavorited(@RequestParam UUID productId) {
        var userId = currentUserId();
        var fav = favoriteService.isFavorited(userId, productId);
        return ApiResponse.ok(new FavoriteCheckRes(productId, fav));
    }

    /** 某商品收藏数（可匿名或保留登录；此处不强制改动你的安全策略） */
    @GetMapping(value = "/count", produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<Long> count(@RequestParam UUID productId) {
        var n = favoriteService.countForProduct(productId);
        return ApiResponse.ok(n);
    }

    // -------------------- helpers --------------------

    private UUID currentUserId() {
        // 1) 从 SecurityContext 读取
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null) {
            try {
                return UUID.fromString(auth.getName());
            } catch (IllegalArgumentException ignored) {
            }
        }
        // 2) 兜底：从上游传入的 X-User-Id 读取
        String uidHeader = request.getHeader("X-User-Id");
        if (uidHeader != null && !uidHeader.isBlank()) {
            try {
                return UUID.fromString(uidHeader.trim());
            } catch (IllegalArgumentException ignored) {
            }
        }
        throw new IllegalStateException("Cannot resolve current user id");
    }

    private Sort parseSort(String sort) {
        try {
            String[] p = sort.split(",", 2);
            String field = (p.length > 0 && !p[0].isBlank()) ? p[0].trim() : "createdAt";
            Sort.Direction dir = (p.length == 2 && "ASC".equalsIgnoreCase(p[1].trim()))
                    ? Sort.Direction.ASC : Sort.Direction.DESC;
            return Sort.by(dir, field);
        } catch (Exception e) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
    }

    /** 返回：是否收藏 */
    public record FavoriteCheckRes(UUID productId, boolean favorited) {}
}
