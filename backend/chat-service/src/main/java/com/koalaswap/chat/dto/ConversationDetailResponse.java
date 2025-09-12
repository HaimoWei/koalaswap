package com.koalaswap.chat.dto;

import com.koalaswap.chat.model.OrderStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ConversationDetailResponse(
        UUID id,
        UUID productId,
        UUID buyerId,
        UUID sellerId,
        OrderStatus orderStatus,
        String productFirstImage,
        UUID myReadToMessageId,     // 当前用户读到的 messageId
        UUID peerReadToMessageId,   // 对方读到的 messageId
        // 新增商品信息
        String productTitle,
        BigDecimal productPrice,
        // 新增对方用户信息
        String peerNickname,
        String peerAvatar,
        // 新增完整订单信息
        OrderDetail orderDetail
) {
    
    /**
     * 订单详情内嵌记录
     */
    public record OrderDetail(
            UUID orderId,
            BigDecimal priceSnapshot,
            OrderStatus status,
            Instant createdAt,
            String trackingNo,      // 物流单号
            String carrier          // 承运商
    ) {}
}
