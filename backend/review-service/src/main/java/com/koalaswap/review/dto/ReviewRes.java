package com.koalaswap.review.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ReviewRes(
        UUID id, UUID orderId,
        short rating, String comment,
        String reviewerRole, boolean anonymous,
        Instant createdAt,
        UserBrief reviewer, UserBrief reviewee,
        ProductBrief product,
        List<AppendBrief> appends
) {
    public record UserBrief(UUID id, String displayName, String avatarUrl){}

    // ✅ 增加 firstImageUrl
    public record ProductBrief(UUID id, String title, String firstImageUrl){}

    public record AppendBrief(UUID id, String comment, Instant createdAt, UserBrief reviewer, boolean anonymous){}
}
