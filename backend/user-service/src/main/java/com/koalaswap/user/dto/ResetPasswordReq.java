package com.koalaswap.user.dto;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotBlank;
/**
 * 忘记密码：提交重置密码
 */
public record ResetPasswordReq(
        @NotBlank String token,
        @Size(min = 8, message = "Password must be at least 8 characters long.") String newPassword
) {}
