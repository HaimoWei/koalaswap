// src/main/java/com/koalaswap/chat/events/OrderStatusEvent.java
package com.koalaswap.chat.events;

import com.koalaswap.chat.model.OrderStatus;

import java.time.Instant;
import java.util.UUID;

public class OrderStatusEvent {
    public UUID orderId;
    public UUID productId;
    public UUID buyerId;
    public UUID sellerId;
    public OrderStatus newStatus;
    public Instant occurredAt;
}
