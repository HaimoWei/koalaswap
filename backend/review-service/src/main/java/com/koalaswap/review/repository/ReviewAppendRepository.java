package com.koalaswap.review.repository;

import com.koalaswap.review.entity.ReviewAppend;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface ReviewAppendRepository extends JpaRepository<ReviewAppend, UUID> {
    List<ReviewAppend> findByReview_IdOrderByCreatedAtAsc(UUID reviewId);
}
