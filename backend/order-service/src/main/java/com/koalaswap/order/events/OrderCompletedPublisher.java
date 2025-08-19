package com.koalaswap.order.events;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j @Component @RequiredArgsConstructor
public class OrderCompletedPublisher {
    private final StringRedisTemplate redis;
    private final ObjectMapper om = new ObjectMapper();

    @Value("${app.order-events.channel:orders:completed}")
    private String channel;

    @TransactionalEventListener
    public void onCompleted(OrderCompletedEvent e) {
        try {
            String payload = om.createObjectNode()
                    .put("orderId",   e.orderId().toString())
                    .put("buyerId",   e.buyerId().toString())
                    .put("sellerId",  e.sellerId().toString())
                    .put("productId", e.productId().toString())
                    .put("completedAt", e.completedAt().toString())
                    .toString();
            redis.convertAndSend(channel, payload);
            log.debug("order-completed published: {}", payload);
        } catch (Exception ex) {
            log.warn("publish order-completed failed: {}", ex.toString());
        }
    }
}
