package com.koalaswap.review.entity;

import com.koalaswap.review.model.ReviewSlotStatus;
import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Getter @Setter
@Entity @Table(name="review_slots",
        uniqueConstraints=@UniqueConstraint(columnNames={"order_id","reviewer_id"}))
public class ReviewSlot {
    @Id @GeneratedValue private UUID id;

    @Column(name="order_id",   nullable=false) private UUID orderId;
    @Column(name="product_id", nullable=false) private UUID productId;

    @Column(name="reviewer_id", nullable=false) private UUID reviewerId; // 我
    @Column(name="reviewee_id", nullable=false) private UUID revieweeId; // 对方

    @Column(name="reviewer_role", nullable=false) private String reviewerRole; // BUYER/SELLER

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name="status", nullable=false, columnDefinition="review_slot_status")
    private ReviewSlotStatus status = ReviewSlotStatus.PENDING;

    @Column(name="due_at") private Instant dueAt;

    @CreationTimestamp
    @Column(name="created_at", nullable=false, updatable=false) private Instant createdAt;
}
