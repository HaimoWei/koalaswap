// src/main/java/com/koalaswap/chat/repository/MessageRepository.java
package com.koalaswap.chat.repository;

import com.koalaswap.chat.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {
    Page<Message> findByConversationIdOrderByCreatedAtAsc(UUID conversationId, Pageable pageable);
    Message findTop1ByConversationIdOrderByCreatedAtDesc(UUID conversationId);
}
