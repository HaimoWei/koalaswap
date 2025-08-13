package com.koalaswap.user.dto;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;


/**
 * 忘记密码：请求重置邮件
 */
public record ForgotPasswordReq(
        @Email @NotBlank String email
) {}