package com.koalaswap.review.repository;

import com.koalaswap.review.entity.ReviewSlot;
import com.koalaswap.review.model.ReviewSlotStatus;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.*;

@Repository
public interface ReviewSlotRepository extends JpaRepository<ReviewSlot, UUID> {

    Page<ReviewSlot> findByReviewerIdAndReviewerRoleAndStatus(UUID reviewerId, String role,
                                                              ReviewSlotStatus status, Pageable pageable);

    @Query(value = """
        INSERT INTO review_slots (order_id, product_id, reviewer_id, reviewee_id, reviewer_role, status, created_at)
        VALUES (:orderId, :productId, :reviewerId, :revieweeId, :role, 'PENDING', NOW())
        ON CONFLICT (order_id, reviewer_id) DO NOTHING
        """, nativeQuery = true)
    @Modifying
    void insertIfAbsent(@Param("orderId") UUID orderId,
                        @Param("productId") UUID productId,
                        @Param("reviewerId") UUID reviewerId,
                        @Param("revieweeId") UUID revieweeId,
                        @Param("role") String reviewerRole);

    @Modifying
    @Query("update ReviewSlot s set s.status = :status where s.orderId = :orderId and s.reviewerId = :reviewerId")
    int updateStatus(UUID orderId, UUID reviewerId, ReviewSlotStatus status);

    @Modifying
    @Query("update ReviewSlot s set s.status = 'EXPIRED' where s.dueAt < :now and s.status = 'PENDING'")
    int expireSlots(Instant now);
}
