// backend/user-service/src/main/java/com/koalaswap/user/controller/AuthController.java
package com.koalaswap.user.controller;

import com.koalaswap.common.dto.ApiResponse;
import com.koalaswap.user.dto.LoginReq;
import com.koalaswap.user.dto.LoginRes;
import com.koalaswap.user.dto.MyProfileRes;
import com.koalaswap.user.dto.RegisterReq;
import com.koalaswap.user.service.AuthService;
import com.koalaswap.user.repository.UserRepository;
import com.koalaswap.user.service.EmailVerificationService;
import org.springframework.security.core.Authentication;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

/**
 * 认证相关的 HTTP API 入口。
 * 职责很“薄”：只做 参数接收(@RequestBody/@Valid) → 调 Service → 包装统一返回。
 * 真正业务（查库、加密、校验等）都在 AuthService。
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final EmailVerificationService verificationService; // 发/验邮件
    private final UserRepository userRepository;                // 查用户

    /** 注册：成功后返回“我的资料视图”（emailVerified 初始为 false） */
    @PostMapping("/register")
    public ApiResponse<MyProfileRes> register(@Valid @RequestBody RegisterReq req) {
        var profile = authService.register(req);
        return ApiResponse.ok(profile);
    }

    /** 登录：校验邮箱+密码；若邮箱未验证，提示先完成验证（后续我们会做发信） */
    @PostMapping("/login")
    public ApiResponse<LoginRes> login(@Valid @RequestBody LoginReq req) {
        var profile = authService.login(req);
        return ApiResponse.ok(profile);
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(Authentication auth) {
        UUID uid = UUID.fromString(auth.getName()); // JwtAuthFilter里把 userId 放进了 Authentication
        authService.logoutAll(uid);
        return ApiResponse.ok(null);
    }

    /** GET /api/auth/verify?token=...  点击邮件里的链接后调用；校验并激活账号 */
    @GetMapping("/verify")
    public ApiResponse<Void> verify(@RequestParam String token) {
        verificationService.verify(token);
        return ApiResponse.ok(null);
    }

    /** POST /api/auth/resend?email=...  未登录也可调用；用于“等待验证”页或登录页的重发按钮 */
    @PostMapping("/resend")
    public ApiResponse<Void> resend(@RequestParam @Email String email) {
        userRepository.findByEmail(email).ifPresent(u -> {
            if (!u.isEmailVerified()) {
                try { verificationService.issueAndSend(u); } catch (IllegalArgumentException ignored) {}
            }
        });
        return ApiResponse.ok(null); // 始终 200
    }

}
