// src/main/java/com/koalaswap/chat/service/ConversationCommandService.java
package com.koalaswap.chat.service;

import com.koalaswap.chat.entity.ConversationParticipant;
import com.koalaswap.chat.repository.ConversationParticipantRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class ConversationCommandService {
    private final ConversationParticipantRepository partRepo;
    private final ConversationAuth auth;

    public ConversationCommandService(ConversationParticipantRepository p, ConversationAuth a) {
        this.partRepo = p; this.auth = a;
    }

    private ConversationParticipant me(UUID conversationId, UUID userId) {
        return partRepo.findByConversationIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new EntityNotFoundException("Participant not found"));
    }

    @Transactional
    public void softDelete(UUID conversationId, UUID userId) {
        auth.assertParticipant(conversationId, userId);
        var p = me(conversationId, userId);
        p.setDeletedAt(Instant.now());
        partRepo.save(p);
    }

    @Transactional
    public void archive(UUID conversationId, UUID userId, boolean archived) {
        auth.assertParticipant(conversationId, userId);
        var p = me(conversationId, userId);
        p.setArchived(archived);
        partRepo.save(p);
    }

    @Transactional
    public void pin(UUID conversationId, UUID userId, boolean pin) {
        auth.assertParticipant(conversationId, userId);
        var p = me(conversationId, userId);
        p.setPinnedAt(pin ? Instant.now() : null);
        partRepo.save(p);
    }

    @Transactional
    public void mute(UUID conversationId, UUID userId, Integer minutes) {
        auth.assertParticipant(conversationId, userId);
        var p = me(conversationId, userId);
        if (minutes == null || minutes <= 0) {
            p.setMutedUntil(null);
        } else {
            p.setMutedUntil(Instant.now().plus(minutes, ChronoUnit.MINUTES));
        }
        partRepo.save(p);
    }
}
