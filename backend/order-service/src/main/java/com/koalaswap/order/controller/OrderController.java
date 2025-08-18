package com.koalaswap.order.controller;

import com.koalaswap.common.dto.ApiResponse;
import com.koalaswap.common.security.SecuritySupport;
import com.koalaswap.order.dto.*;
import com.koalaswap.order.model.OrderStatus;
import com.koalaswap.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * 对外 API（用途已在每个方法注释中写明）：
 * - POST /api/orders                 创建订单（买家）
 * - GET  /api/orders/{id}            订单详情（买家/卖家）
 * - GET  /api/orders?role=buyer|seller[&status=&page=&size=]  我买到的/我卖出的
 * - POST /api/orders/{id}/pay        支付（模拟；买家）
 * - POST /api/orders/{id}/ship       发货（卖家）
 * - POST /api/orders/{id}/confirm    确认收货（买家）
 * - POST /api/orders/{id}/cancel     取消（买家/卖家，按状态）
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService service;

    /** 创建订单（买家对某商品下单） */
    @PostMapping
    public ApiResponse<OrderRes> create(@Valid @RequestBody OrderCreateReq req, Authentication auth) {
        UUID buyerId = SecuritySupport.requireUserId(auth);
        return ApiResponse.ok(service.create(buyerId, req));
    }

    /** 订单详情（仅参与者可见） */
    @GetMapping("/{id}")
    public ApiResponse<OrderRes> get(@PathVariable UUID id, Authentication auth) {
        UUID uid = SecuritySupport.requireUserId(auth);
        return ApiResponse.ok(service.get(uid, id));
    }

    /** 分页列表：我买到的 / 我卖出的；可选 status 过滤 */
    @GetMapping
    public ApiResponse<Page<OrderRes>> list(
            @RequestParam String role,                              // buyer | seller
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            Authentication auth
    ) {
        UUID uid = SecuritySupport.requireUserId(auth);
        return ApiResponse.ok(service.list(uid, role, status, page, size, sort));
    }

    /** 支付（模拟）：PENDING -> PAID，仅买家 */
    @PostMapping("/{id}/pay")
    public ApiResponse<OrderRes> pay(@PathVariable UUID id, @RequestBody(required = false) PayReq req, Authentication auth) {
        UUID buyerId = SecuritySupport.requireUserId(auth);
        return ApiResponse.ok(service.pay(buyerId, id, req));
    }

    /** 发货：PAID -> SHIPPED，仅卖家 */
    @PostMapping("/{id}/ship")
    public ApiResponse<OrderRes> ship(@PathVariable UUID id, @RequestBody @Valid ShipReq req, Authentication auth) {
        UUID sellerId = SecuritySupport.requireUserId(auth);
        return ApiResponse.ok(service.ship(sellerId, id, req));
    }

    /** 确认收货：SHIPPED -> COMPLETED，仅买家 */
    @PostMapping("/{id}/confirm")
    public ApiResponse<OrderRes> confirm(@PathVariable UUID id, Authentication auth) {
        UUID buyerId = SecuritySupport.requireUserId(auth);
        return ApiResponse.ok(service.confirm(buyerId, id));
    }

    /** 取消订单：买家 PENDING/PAID；卖家 PENDING */
    @PostMapping("/{id}/cancel")
    public ApiResponse<OrderRes> cancel(@PathVariable UUID id, @RequestBody(required = false) CancelReq req, Authentication auth) {
        UUID actorId = SecuritySupport.requireUserId(auth);
        return ApiResponse.ok(service.cancel(actorId, id, req));
    }
}
