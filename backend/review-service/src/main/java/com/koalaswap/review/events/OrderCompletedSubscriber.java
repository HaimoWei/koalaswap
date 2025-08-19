package com.koalaswap.review.events;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.koalaswap.review.repository.ReviewSlotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderCompletedSubscriber {

    private final ObjectMapper om = new ObjectMapper();
    private final ReviewSlotRepository slots;

    /** 订阅到的 JSON：
     * { "orderId":"...", "buyerId":"...", "sellerId":"...", "productId":"...", "completedAt":"..." }
     */
    @Transactional
    public void onMessage(String raw) {
        try {
            JsonNode n = om.readTree(raw);
            UUID orderId   = UUID.fromString(n.path("orderId").asText());
            UUID buyerId   = UUID.fromString(n.path("buyerId").asText());
            UUID sellerId  = UUID.fromString(n.path("sellerId").asText());
            UUID productId = UUID.fromString(n.path("productId").asText());

            // 幂等：UNIQUE(order_id, reviewer_id)
            slots.insertIfAbsent(orderId, productId, buyerId, sellerId, "BUYER");
            slots.insertIfAbsent(orderId, productId, sellerId, buyerId, "SELLER");
            log.debug("review-slots upserted for order {}", orderId);
        } catch (Exception e) {
            log.warn("Ignore order-completed message: {}", e.toString());
        }
    }
}
