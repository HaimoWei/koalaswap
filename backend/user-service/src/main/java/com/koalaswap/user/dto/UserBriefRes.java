// backend/user-service/src/main/java/com/koalaswap/user/dto/UserBriefRes.java
package com.koalaswap.user.dto;

import java.util.UUID;

public record UserBriefRes(
        UUID id,
        String displayName,
        String avatarUrl
) {}
