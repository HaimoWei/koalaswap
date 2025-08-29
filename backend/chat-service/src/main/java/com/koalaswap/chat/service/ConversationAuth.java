// src/main/java/com/koalaswap/chat/service/ConversationAuth.java
package com.koalaswap.chat.service;

import com.koalaswap.chat.repository.ConversationParticipantRepository;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class ConversationAuth {
    private final ConversationParticipantRepository partRepo;
    public ConversationAuth(ConversationParticipantRepository p){ this.partRepo = p; }

    public void assertParticipant(UUID conversationId, UUID userId) {
        var ok = partRepo.findByConversationIdAndUserId(conversationId, userId).isPresent();
        if (!ok) throw new IllegalStateException("FORBIDDEN: not a participant");
    }
}
