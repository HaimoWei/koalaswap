package com.koalaswap.review.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Getter @Setter
@Entity @Table(name="order_review_appends")
public class ReviewAppend {
    @Id @GeneratedValue private UUID id;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="review_id", nullable=false)
    private OrderReview review;

    @Column(columnDefinition="text", nullable=false) private String comment;

    @CreationTimestamp
    @Column(name="created_at", nullable=false, updatable=false) private Instant createdAt;
}
