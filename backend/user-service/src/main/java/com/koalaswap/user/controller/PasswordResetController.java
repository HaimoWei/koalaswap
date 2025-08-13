package com.koalaswap.user.controller;

import com.koalaswap.common.dto.ApiResponse;
import com.koalaswap.user.dto.ForgotPasswordReq;
import com.koalaswap.user.dto.ResetPasswordReq;
import com.koalaswap.user.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 忘记密码接口（已在 SecurityConfig 放行 /api/auth/**）：
 * 1) POST /api/auth/forgot-password         发起重置（总是 200，不泄露邮箱是否存在）
 * 2) GET  /api/auth/reset-password/validate 简验 token 是否可用（返回 true/false）
 * 3) POST /api/auth/reset-password          提交新密码（成功 200；失败 400）
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class PasswordResetController {

    private final PasswordResetService service;

    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgot(@Valid @RequestBody ForgotPasswordReq req) {
        service.requestReset(req.email());
        return ApiResponse.ok(null);
    }

    @GetMapping("/reset-password/validate")
    public ApiResponse<Boolean> validate(@RequestParam("token") String token) {
        boolean ok = service.isTokenUsable(token);
        return ApiResponse.ok(ok);
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> reset(@Valid @RequestBody ResetPasswordReq req) {
        service.resetPassword(req.token(), req.newPassword());
        return ApiResponse.ok(null);
    }
}
