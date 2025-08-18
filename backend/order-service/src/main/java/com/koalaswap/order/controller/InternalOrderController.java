package com.koalaswap.order.controller;

import com.koalaswap.common.dto.ApiResponse;
import com.koalaswap.order.model.OrderStatus;
import com.koalaswap.order.repository.OrderRepository;
import org.springframework.web.bind.annotation.*;

import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;

/** 内部接口：判断商品是否存在“进行中”的订单（给 product-service 做标签/过滤） */
@RestController
@RequestMapping("/api/internal/orders")
public class InternalOrderController {

    private static final Set<OrderStatus> OPEN = EnumSet.of(
            OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.SHIPPED
    );

    private final OrderRepository orders;

    public InternalOrderController(OrderRepository orders) { this.orders = orders; }

    @GetMapping("/active")
    public ApiResponse<Boolean> hasActive(@RequestParam UUID productId) {
        boolean exists = orders.existsByProductIdAndStatusIn(productId, OPEN);
        return ApiResponse.ok(exists);
    }
}
