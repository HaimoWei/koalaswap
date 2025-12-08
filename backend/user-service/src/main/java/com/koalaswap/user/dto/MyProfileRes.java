// backend/user-service/src/main/java/com/koalaswap/user/dto/MyProfileRes.java
package com.koalaswap.user.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * "My profile" view (only visible to the owner):
 * - May include email, registration time, verification status and other private information.
 * - Used for responses after signup/login success, or GET /users/me.
 */
public record MyProfileRes(
        UUID id,                            // Unique user identifier (UUID)
        String email,                       // Email (only returned in "self" scenarios)
        String displayName,                 // Display name
        String avatarUrl,                   // Avatar URL
        String bio,                         // Short bio
        String location,                    // Location
        boolean phoneVerified,              // Phone verification status
        boolean emailVerified,              // Whether email is verified
        Double ratingAvg,                   // Average rating (aggregated from order reviews)
        Integer ratingCount,                // Number of ratings
        java.time.LocalDate memberSince,    // Member since (date)
        Instant lastActiveAt,               // Last active time
        Instant createdAt                   // 注册时间（审计/展示）
) {}
