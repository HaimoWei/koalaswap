package com.koalaswap.chat.dto;

import com.koalaswap.chat.model.OrderStatus;
import java.util.UUID;

public record ConversationDetailResponse(
        UUID id,
        UUID productId,
        UUID buyerId,
        UUID sellerId,
        OrderStatus orderStatus,
        String productFirstImage,
        UUID myReadToMessageId,     // 当前用户读到的 messageId
        UUID peerReadToMessageId    // 对方读到的 messageId
) {}
