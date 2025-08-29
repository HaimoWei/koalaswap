// src/main/java/com/koalaswap/chat/repository/ConversationParticipantRepository.java
package com.koalaswap.chat.repository;

import com.koalaswap.chat.entity.ConversationParticipant;
import com.koalaswap.chat.entity.ConversationParticipant.PK;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ConversationParticipantRepository extends JpaRepository<ConversationParticipant, PK> {
    Optional<ConversationParticipant> findByConversationIdAndUserId(UUID conversationId, UUID userId);
}
