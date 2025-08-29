// src/main/java/com/koalaswap/chat/entity/Conversation.java
package com.koalaswap.chat.entity;

import com.koalaswap.chat.model.ConversationStatus;
import com.koalaswap.chat.model.OrderStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "conversations",
        uniqueConstraints = @UniqueConstraint(name = "uq_conv_unique_triplet",
                columnNames = {"product_id","buyer_id","seller_id"}))
@Getter @Setter @NoArgsConstructor
@AllArgsConstructor @Builder
public class Conversation {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "product_id", nullable = false, columnDefinition = "uuid")
    private UUID productId;

    @Column(name = "order_id", columnDefinition = "uuid")
    private UUID orderId;

    @Column(name = "buyer_id", nullable = false, columnDefinition = "uuid")
    private UUID buyerId;

    @Column(name = "seller_id", nullable = false, columnDefinition = "uuid")
    private UUID sellerId;

    @Column(name = "started_by", nullable = false, columnDefinition = "uuid")
    private UUID startedBy;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)                           // 与 order-service 一致
    @Column(name = "status", nullable = false, columnDefinition = "conversation_status")
    private ConversationStatus status = ConversationStatus.OPEN;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)                           // 与 order-service 一致
    @Column(name = "order_status_cache", columnDefinition = "order_status")
    private OrderStatus orderStatusCache;

    @Column(name = "product_first_image")
    private String productFirstImage;

    @Column(name = "last_message_id", columnDefinition = "uuid")
    private UUID lastMessageId;

    @Column(name = "last_message_at")
    private Instant lastMessageAt;

    @Column(name = "last_message_preview")
    private String lastMessagePreview;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Conversation(UUID productId, UUID orderId, UUID buyerId, UUID sellerId, UUID startedBy) {
        this.productId = productId;
        this.orderId = orderId;
        this.buyerId = buyerId;
        this.sellerId = sellerId;
        this.startedBy = startedBy;

    }
}
