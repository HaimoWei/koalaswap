// src/main/java/com/koalaswap/chat/dto/CreateConversationRequest.java
package com.koalaswap.chat.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/**
 * [B3 CHANGE]
 * - sellerId 改为可选；优先自动通过 productId 推导；若前端仍传，作为兜底校验一致性。
 */
public record CreateConversationRequest(
        @NotNull UUID productId,
        UUID orderId,
        UUID sellerId // 可为 null；后端会用 ProductClient 推导
) {}
