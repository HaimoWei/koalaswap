// src/main/java/com/koalaswap/chat/dto/ConversationListItem.java
package com.koalaswap.chat.dto;

import com.koalaswap.chat.model.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * [B3 CHANGE]
 * - 新增 peerNickname / peerAvatar，可由跨服务聚合填充；未拿到时为 null。
 * - 新增 productTitle / productPrice，用于显示商品基本信息
 * - 新增 orderPriceSnapshot，显示订单价格快照
 */
public record ConversationListItem(
        UUID id,
        UUID productId,
        UUID orderId,
        UUID buyerId,
        UUID sellerId,
        UUID peerUserId,
        int unread,
        boolean archived,
        Instant pinnedAt,
        OrderStatus orderStatus,
        String productFirstImage,
        Instant lastMessageAt,
        String lastMessagePreview,
        // [B3 CHANGE] below:
        String peerNickname,
        String peerAvatar,
        // 新增商品信息字段
        String productTitle,
        BigDecimal productPrice,
        // 新增订单价格快照
        BigDecimal orderPriceSnapshot
) {}
