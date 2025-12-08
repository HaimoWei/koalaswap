package com.koalaswap.review.events;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Component
public class ReviewEventPublisher {

    private final StringRedisTemplate redis;
    private final ObjectMapper om;

    @Value("${app.review-events.channel:review-events}")
    private String channel;

    public ReviewEventPublisher(StringRedisTemplate redis) {
        this.redis = redis;
        this.om = new ObjectMapper();
        this.om.registerModule(new JavaTimeModule());
    }

    @TransactionalEventListener
    public void onReviewEvent(ReviewEvent event) {
        try {
            String payload = om.writeValueAsString(event);

            System.out.println("[ReviewEventPublisher] Publishing review event to Redis channel: " + channel);
            System.out.println("[ReviewEventPublisher] Event payload: " + payload);

            redis.convertAndSend(channel, payload);

            System.out.println("[ReviewEventPublisher] Review event published successfully");
            log.debug("review-event published: {}", payload);
        } catch (Exception ex) {
            System.err.println("[ReviewEventPublisher] Failed to publish review event: " + ex.getMessage());
            log.warn("publish review-event failed: {}", ex.toString());
        }
    }

    public record ReviewEvent(
            UUID orderId,
            UUID productId,
            UUID buyerId,
            UUID sellerId,
            UUID reviewerId,
            String reviewerRole,
            Instant occurredAt
    ) {}
}
