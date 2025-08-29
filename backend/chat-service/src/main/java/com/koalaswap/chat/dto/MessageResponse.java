// src/main/java/com/koalaswap/chat/dto/MessageResponse.java
package com.koalaswap.chat.dto;

import com.koalaswap.chat.model.MessageType;
import com.koalaswap.chat.model.SystemEvent;

import java.time.Instant;
import java.util.UUID;

public record MessageResponse(
        UUID id,
        MessageType type,
        UUID senderId,
        String body,
        String imageUrl,
        SystemEvent systemEvent,
        String meta,
        Instant createdAt
) {}
