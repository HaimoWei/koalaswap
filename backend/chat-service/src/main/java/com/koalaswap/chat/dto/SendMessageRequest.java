// src/main/java/com/koalaswap/chat/dto/SendMessageRequest.java
package com.koalaswap.chat.dto;

import com.koalaswap.chat.model.MessageType;
import jakarta.validation.constraints.NotNull;

public record SendMessageRequest(
        @NotNull MessageType type,
        String body,
        String imageUrl
) {}
