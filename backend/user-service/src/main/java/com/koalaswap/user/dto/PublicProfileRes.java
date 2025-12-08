// backend/user-service/src/main/java/com/koalaswap/user/dto/PublicProfileRes.java
package com.koalaswap.user.dto;

import java.util.UUID;

/**
 * "Public profile" view (visible to others):
 * - Does not expose email or other private data.
 * - Used for user profile pages, seller info on item detail pages, review lists, etc.
 */
public record PublicProfileRes(
        UUID id,                    // Public user ID (can be used in routes/links)
        String displayName,         // Display name
        String avatarUrl,           // Avatar URL
        String bio,                 // Short bio
        String location,            // Location
        boolean phoneVerified,      // Phone verification status
        boolean emailVerified,      // Email verification status
        Double ratingAvg,           // Average rating
        Integer ratingCount,        // Number of ratings
        java.time.LocalDate memberSince,  // Member since (date)
        java.time.Instant lastActiveAt,   // Last active time
        java.time.Instant createdAt       // Registration time
) {}
