// order-service/src/main/java/com/koalaswap/order/controller/InternalOrderBriefController.java
package com.koalaswap.order.controller;

import com.koalaswap.common.dto.ApiResponse;
import com.koalaswap.order.entity.OrderEntity;
import com.koalaswap.order.model.OrderStatus;
import com.koalaswap.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/internal/orders")
@RequiredArgsConstructor
public class InternalOrderBriefController {

    private final OrderRepository orders;

    public record OrderBrief(UUID id, OrderStatus status) {}

    // 批量 brief：GET /api/internal/orders/brief/batch?ids=...&ids=...
    @GetMapping("/brief/batch")
    public ApiResponse<List<OrderBrief>> briefBatch(@RequestParam("ids") List<UUID> ids) {
        if (ids == null || ids.isEmpty()) return ApiResponse.ok(List.of());
        var list = orders.findAllById(ids).stream()
                .map(o -> new OrderBrief(o.getId(), o.getStatus()))
                .collect(Collectors.toList());
        return ApiResponse.ok(list);
    }
}
