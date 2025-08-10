package com.koalaswap.user.dto;

/**
 * 忘记密码：提交重置密码
 */
public record ResetPasswordReq(String token, String newPassword) {}
