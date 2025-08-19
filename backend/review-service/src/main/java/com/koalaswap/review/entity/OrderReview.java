package com.koalaswap.review.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Getter @Setter
@Entity @Table(name="order_reviews", uniqueConstraints=
@UniqueConstraint(columnNames={"order_id","reviewer_id"}))
public class OrderReview {
    @Id @GeneratedValue private UUID id;

    @Column(name="order_id", nullable=false)   private UUID orderId;
    @Column(name="reviewer_id", nullable=false)private UUID reviewerId;
    @Column(name="reviewee_id", nullable=false)private UUID revieweeId;

    @Column(nullable=false) private short rating; // 1..5
    @Column(columnDefinition="text") private String comment;

    @Column(name="reviewer_role", nullable=false) private String reviewerRole; // BUYER|SELLER
    @Column(name="is_anonymous", nullable=false)  private boolean anonymous = false;

    @CreationTimestamp
    @Column(name="created_at", nullable=false, updatable=false) private Instant createdAt;

    @Column(name="updated_at", nullable=false) private Instant updatedAt = Instant.now();
}
