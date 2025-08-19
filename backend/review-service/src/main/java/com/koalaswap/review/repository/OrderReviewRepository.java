package com.koalaswap.review.repository;

import com.koalaswap.review.entity.OrderReview;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface OrderReviewRepository extends JpaRepository<OrderReview, UUID> {
    Optional<OrderReview> findByOrderIdAndReviewerId(UUID orderId, UUID reviewerId);
    Page<OrderReview> findByRevieweeId(UUID revieweeId, Pageable pageable);
    Page<OrderReview> findByReviewerId(UUID reviewerId, Pageable pageable);

    @Query("select r from OrderReview r where r.orderId = :orderId")
    List<OrderReview> findAllByOrderId(UUID orderId);
}
