package com.koalaswap.review.dto;

import java.time.Instant;
import java.util.List; // [ADDED]
import java.util.UUID;

public record ReviewRes(
        UUID id, UUID orderId,
        short rating, String comment,
        String reviewerRole, boolean anonymous,
        Instant createdAt,
        UserBrief reviewer, UserBrief reviewee,
        ProductBrief product,
        List<AppendBrief> appends // [ADDED]
) {
    public record UserBrief(UUID id, String displayName, String avatarUrl){}
    public record ProductBrief(UUID id, String title){}

    // [ADDED] 追评精简结构（复用主评的 reviewer/anonymous 规则）
    public record AppendBrief(UUID id, String comment, Instant createdAt, UserBrief reviewer, boolean anonymous){}
}
