// src/main/java/com/koalaswap/chat/repository/ConversationReadRepository.java
package com.koalaswap.chat.repository;

import com.koalaswap.chat.dto.ConversationListItem;
import com.koalaswap.chat.entity.ConversationParticipant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface ConversationReadRepository extends Repository<com.koalaswap.chat.entity.Conversation, UUID> {

    @Query("""
      select new com.koalaswap.chat.dto.ConversationListItem(
        c.id, c.productId, c.orderId, c.buyerId, c.sellerId,
        case when c.buyerId = :userId then c.sellerId else c.buyerId end,
        cp.unreadCount, cp.archived, cp.pinnedAt,
        c.orderStatusCache, c.productFirstImage, c.lastMessageAt, c.lastMessagePreview,
        null, null, null, null, null
      )
      from ConversationParticipant cp
      join cp.conversationRef c
      where cp.userId = :userId
        and cp.deletedAt is null
        and (:onlyArchived = false or cp.archived = true)
        and (:onlyPinned   = false or cp.pinnedAt is not null)
      order by coalesce(c.lastMessageAt, c.updatedAt) desc
    """)
    Page<ConversationListItem> pageForUser(
            @Param("userId") UUID userId,
            @Param("onlyArchived") boolean onlyArchived,
            @Param("onlyPinned") boolean onlyPinned,
            Pageable pageable
    );
}
