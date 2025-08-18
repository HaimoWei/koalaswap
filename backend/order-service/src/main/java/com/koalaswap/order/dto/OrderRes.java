package com.koalaswap.order.dto;

import com.koalaswap.order.model.OrderStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** 订单返回模型（给前端/内部使用） */
public record OrderRes(
        UUID id,
        UUID productId,
        UUID buyerId,
        UUID sellerId,
        BigDecimal priceSnapshot,
        OrderStatus status,
        Instant createdAt,
        Instant closedAt
) {}
