package com.koalaswap.review.dto;

import jakarta.validation.constraints.*;

import java.util.UUID;

public record ReviewCreateReq(
        @NotNull UUID orderId,
        @Min(1) @Max(5) short rating,
        @Size(max=4000) String comment,
        boolean isAnonymous
) {}
