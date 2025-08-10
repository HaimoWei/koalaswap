// backend/user-service/src/main/java/com/koalaswap/user/dto/PublicProfileRes.java
package com.koalaswap.user.dto;

import java.util.UUID;

/**
 * “公共资料”视图（别人看到）：
 * - 不暴露邮箱等隐私。
 * - 用于用户主页、商品详情里的“卖家信息”、评价列表等。
 */
public record PublicProfileRes(
        UUID id,             // 公共可见的用户ID（可用于路由/链接）
        String displayName,  // 昵称
        String avatarUrl,    // 头像
        Double ratingAvg,    // 平均评分
        Integer ratingCount  // 评分次数
) {}
