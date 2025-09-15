package com.koalaswap.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordReq(
    @NotBlank(message = "当前密码不能为空")
    String currentPassword,

    @NotBlank(message = "新密码不能为空")
    @Size(min = 6, max = 50, message = "新密码长度必须在6-50字符之间")
    String newPassword
) {}