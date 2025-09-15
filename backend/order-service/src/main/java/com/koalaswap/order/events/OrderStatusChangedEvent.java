package com.koalaswap.order.events;

import com.koalaswap.order.model.OrderStatus;

import java.time.Instant;
import java.util.UUID;

/**
 * 订单状态变更领域事件（用于跨服务通知，如 chat-service 显示系统消息/刷新状态）。
 */
public record OrderStatusChangedEvent(
        UUID orderId,
        UUID productId,
        UUID buyerId,
        UUID sellerId,
        OrderStatus newStatus,
        Instant occurredAt
) {}

