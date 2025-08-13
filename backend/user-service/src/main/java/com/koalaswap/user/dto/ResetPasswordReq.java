package com.koalaswap.user.dto;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotBlank;
/**
 * 忘记密码：提交重置密码
 */
public record ResetPasswordReq(
        @NotBlank String token,
        @Size(min = 8, message = "密码至少 8 位") String newPassword
) {}