// backend/user-service/src/main/java/com/koalaswap/user/dto/MyProfileRes.java
package com.koalaswap.user.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * “我的资料”视图（仅本人可见）：
 * - 可以包含邮箱、注册时间、认证状态等相对私密的信息。
 * - 用于注册/登录成功后的回包，或 GET /users/me。
 */
public record MyProfileRes(
        UUID id,               // 用户唯一标识（UUID）
        String email,          // 邮箱（只在“本人”场景返回）
        String displayName,    // 昵称
        String avatarUrl,      // 头像
        String bio,            // 个人简介
        boolean emailVerified, // 邮箱是否已验证
        Double ratingAvg,      // 平均评分（从订单评价聚合）
        Integer ratingCount,   // 评分次数
        Instant createdAt      // 注册时间（审计/展示）
) {}
