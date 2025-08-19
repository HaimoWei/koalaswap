package com.koalaswap.order.events;

import java.time.Instant;
import java.util.UUID;

public record OrderCompletedEvent(UUID orderId, UUID buyerId, UUID sellerId, UUID productId, Instant completedAt) {}
