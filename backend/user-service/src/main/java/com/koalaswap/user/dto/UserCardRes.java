// backend/user-service/src/main/java/com/koalaswap/user/dto/UserCardRes.java
package com.koalaswap.user.dto;

import java.util.UUID;

/**
 * “用户卡片”视图（更轻量）：
 * - 用在列表/卡片（如商品列表显示卖家头像+昵称），减少网络负载。
 */
public record UserCardRes(
        UUID id,
        String displayName,
        String avatarUrl
) {}
