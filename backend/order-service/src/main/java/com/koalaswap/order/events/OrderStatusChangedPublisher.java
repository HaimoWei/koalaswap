package com.koalaswap.order.events;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * 将订单状态变更事件发布到 Redis 通道（默认 orders:status-changed）。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderStatusChangedPublisher {

    private final StringRedisTemplate redis;
    private final ObjectMapper om = new ObjectMapper();

    @Value("${app.order-status-events.channel:orders:status-changed}")
    private String channel;

    @TransactionalEventListener
    public void onStatusChanged(OrderStatusChangedEvent e) {
        try {
            String payload = om.createObjectNode()
                    .put("orderId",   e.orderId().toString())
                    .put("productId", e.productId().toString())
                    .put("buyerId",   e.buyerId().toString())
                    .put("sellerId",  e.sellerId().toString())
                    .put("newStatus", e.newStatus().name())
                    .put("occurredAt", e.occurredAt() == null ? null : e.occurredAt().toString())
                    .toString();
            redis.convertAndSend(channel, payload);
            log.debug("order-status-changed published: {}", payload);
        } catch (Exception ex) {
            log.warn("publish order-status-changed failed: {}", ex.toString());
        }
    }
}

