package com.koalaswap.chat.events;

import java.time.Instant;
import java.util.UUID;

public record ReviewEvent(
        UUID orderId,
        UUID productId,
        UUID buyerId,
        UUID sellerId,
        UUID reviewerId, // 评价者ID
        String reviewerRole, // "BUYER" or "SELLER"
        Instant occurredAt
) {}