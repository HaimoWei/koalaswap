package com.koalaswap.review.dto;

import java.time.Instant;
import java.util.*;

public record PendingRes(
        List<Item> buyer, List<Item> seller,
        Counts counts
) {
    public record Item(
            String tab, // buyer|seller|commented
            java.util.UUID orderId,
            java.util.UUID productId,
            Instant closedAt, // 暂无则 null
            Brief counterpart, ProductBrief product
    ) {}
    public record Brief(java.util.UUID id, String displayName, String avatarUrl){}
    public record ProductBrief(java.util.UUID id, String title){}
    public record Counts(int buyer, int seller, int commented){}
}
