package com.koalaswap.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 更新头像请求 DTO
 */
public record UpdateAvatarReq(
    @NotBlank(message = "头像URL不能为空")
    @Size(max = 500, message = "头像URL长度不能超过500字符")
    String avatarUrl
) {
}