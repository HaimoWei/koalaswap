package com.koalaswap.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 更新头像请求 DTO
 */
public record UpdateAvatarReq(
    @NotBlank(message = "Avatar URL must not be empty.")
    @Size(max = 500, message = "Avatar URL must not exceed 500 characters.")
    String avatarUrl
) {
}
