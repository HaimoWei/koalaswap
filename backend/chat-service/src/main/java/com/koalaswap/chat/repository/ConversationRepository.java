// src/main/java/com/koalaswap/chat/repository/ConversationRepository.java
package com.koalaswap.chat.repository;

import com.koalaswap.chat.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ConversationRepository extends JpaRepository<Conversation, UUID> {
    Optional<Conversation> findByProductIdAndBuyerIdAndSellerId(UUID productId, UUID buyerId, UUID sellerId);
}
