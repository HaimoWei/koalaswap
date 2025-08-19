package com.koalaswap.review.dto;

import jakarta.validation.constraints.*;

public record ReviewAppendReq(
        @NotBlank @Size(max=4000) String comment
) {}
