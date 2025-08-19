package com.koalaswap.review.dto;

import java.time.Instant;
import java.util.UUID;

public record ReviewRes(
        UUID id, UUID orderId,
        short rating, String comment,
        String reviewerRole, boolean anonymous,
        Instant createdAt,
        UserBrief reviewer, UserBrief reviewee,
        ProductBrief product
) {
    public record UserBrief(UUID id, String displayName, String avatarUrl){}
    public record ProductBrief(UUID id, String title){}
}
