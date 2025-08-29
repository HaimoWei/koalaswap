// src/main/java/com/koalaswap/chat/dto/ConversationResponse.java
package com.koalaswap.chat.dto;

import com.koalaswap.chat.model.OrderStatus;

import java.time.Instant;
import java.util.UUID;

public record ConversationResponse(
        UUID id,
        UUID productId,
        UUID orderId,
        UUID buyerId,
        UUID sellerId,
        OrderStatus orderStatus,
        String productFirstImage,
        Instant lastMessageAt,
        String lastMessagePreview
) {}
