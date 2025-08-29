// src/main/java/com/koalaswap/chat/entity/Message.java
package com.koalaswap.chat.entity;

import com.koalaswap.chat.model.MessageType;
import com.koalaswap.chat.model.SystemEvent;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "messages")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Message {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "conversation_id", nullable = false, columnDefinition = "uuid")
    private UUID conversationId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)                   // 与 order-service 一致
    @Column(name = "type", nullable = false, columnDefinition = "message_type")
    private MessageType type;

    @Column(name = "sender_id", columnDefinition = "uuid")
    private UUID senderId; // SYSTEM 消息可为空

    @Column(name = "body")
    private String body;

    @Column(name = "image_url")
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)                   // 与 order-service 一致
    @Column(name = "system_event", columnDefinition = "system_event")
    private SystemEvent systemEvent;

    @JdbcTypeCode(SqlTypes.JSON)                         // 建议：明确 JSON 类型（String 映射 JSONB）
    @Column(name = "meta", columnDefinition = "jsonb")
    private String meta;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;
}
