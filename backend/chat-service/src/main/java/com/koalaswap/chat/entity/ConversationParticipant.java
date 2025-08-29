// src/main/java/com/koalaswap/chat/entity/ConversationParticipant.java
package com.koalaswap.chat.entity;

import com.koalaswap.chat.model.ParticipantRole;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "conversation_participants")
@IdClass(ConversationParticipant.PK.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@ToString
public class ConversationParticipant {

    @Id
    @Column(name = "conversation_id", columnDefinition = "uuid")
    private UUID conversationId;

    @Id
    @Column(name = "user_id", columnDefinition = "uuid")
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private ParticipantRole role;

    @Column(name = "last_read_message_id", columnDefinition = "uuid")
    private UUID lastReadMessageId;

    @Builder.Default
    @Column(name = "unread_count", nullable = false)
    private int unreadCount = 0;

    @Builder.Default
    @Column(name = "is_archived", nullable = false)
    private boolean archived = false;

    @Column(name = "muted_until")
    private Instant mutedUntil;

    @Column(name = "pinned_at")
    private Instant pinnedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * 关键补丁：引入一个“只读”关联，方便 JPQL 做关联 join。
     * 不改变表结构：insertable/updatable 都为 false。
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", referencedColumnName = "id", insertable = false, updatable = false)
    @ToString.Exclude
    private Conversation conversationRef;

    /** 复合主键 */
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class PK implements Serializable {
        private UUID conversationId;
        private UUID userId;
    }

    public ConversationParticipant(UUID conversationId, UUID userId, ParticipantRole role) {
        this.conversationId = conversationId;
        this.userId = userId;
        this.role = role;
    }
}
