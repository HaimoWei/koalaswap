package com.koalaswap.review.controller;

import com.koalaswap.common.dto.ApiResponse;
import com.koalaswap.common.security.SecuritySupport;
import com.koalaswap.review.dto.*;
import com.koalaswap.review.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {
    private final ReviewService svc;

    /** 创建首评（买家或卖家） */
    @PostMapping
    public ApiResponse<ReviewRes> create(@Valid @RequestBody ReviewCreateReq req, Authentication auth){
        UUID me = SecuritySupport.requireUserId(auth);
        return ApiResponse.ok(svc.create(me, req));
    }

    /** 追评（仅作者） */
    @PostMapping("/{reviewId}/append")
    public ApiResponse<Void> append(@PathVariable UUID reviewId, @Valid @RequestBody ReviewAppendReq req, Authentication auth){
        UUID me = SecuritySupport.requireUserId(auth);
        svc.append(me, reviewId, req);
        return ApiResponse.ok(null);
    }

    /** 待评价三分页：tab=buyer|seller|commented（便于前端一次拉全也可不带） */
    @GetMapping("/me/pending")
    public ApiResponse<PendingRes> pending(
            @RequestParam(defaultValue = "buyer") String tab,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication auth
    ){
        UUID me = SecuritySupport.requireUserId(auth);
        return ApiResponse.ok(svc.pending(me, tab, page, size));
    }

    /** 我写过的首评（进入追评用） */
    @GetMapping("/me/given")
    public ApiResponse<Page<ReviewRes>> mineGiven(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication auth
    ){
        UUID me = SecuritySupport.requireUserId(auth);
        return ApiResponse.ok(svc.mineGiven(me, page, size));
    }

    /** 用户主页评价列表（公开） */
    @GetMapping("/users/{userId}")
    public ApiResponse<Page<ReviewRes>> listForUser(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "all") String role
    ){
        return ApiResponse.ok(svc.listForUser(userId, page, size, role));
    }

    /** 某订单的双方评价（买卖双方或管理员可在网关层控制；此处简单返回） */
    @GetMapping("/orders/{orderId}")
    public ApiResponse<List<ReviewRes>> byOrder(@PathVariable UUID orderId, Authentication auth){
        SecuritySupport.requireUserId(auth); // 简化：已登录即可；你也可以校验是否该单参与者（从 slot）
        return ApiResponse.ok(svc.byOrder(orderId));
    }
}
