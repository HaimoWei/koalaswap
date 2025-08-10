// backend/user-service/src/main/java/com/koalaswap/user/security/PasswordFreshnessFilter.java
package com.koalaswap.user.security;

import com.koalaswap.common.security.JwtService;
import com.koalaswap.user.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * 二次校验过滤器：让“改过密码”后签发之前的旧 Token 立刻失效。
 * 原理：如果 token 的 iat < users.password_updated_at，则返回 401。
 * 注意：它运行在 JwtAuthFilter 之后，此时 Authentication 已注入。
 */
@RequiredArgsConstructor
public class PasswordFreshnessFilter extends OncePerRequestFilter {

    private final JwtService jwtService;           // 来自 common 模块
    private final UserRepository userRepository;   // 只查一个时间戳

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            chain.doFilter(req, res);
            return;
        }

        // 读取 Authorization 头（JwtAuthFilter 已验证过签名）
        String header = req.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(req, res);
            return;
        }
        String token = header.substring(7);

        // 取 token 的签发时间 iat（由 common 的 JwtService 提供）
        Instant tokenIat;
        try {
            tokenIat = jwtService.getIssuedAt(token);
        } catch (Exception e) {
            chain.doFilter(req, res);
            return;
        }

        // principal 在你项目里就是 userId 字符串
        UUID userId = UUID.fromString(auth.getName());

        Optional<Instant> pwdAtOpt = userRepository.findPasswordUpdatedAt(userId);
        if (pwdAtOpt.isPresent()) {
            Instant pwdAt = pwdAtOpt.get();
            if (pwdAt != null && tokenIat.isBefore(pwdAt)) {
                // 旧 token：清空上下文并返回 401
                SecurityContextHolder.clearContext();
                res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                res.setContentType("application/json;charset=UTF-8");
                res.getWriter().write("{\"code\":401,\"message\":\"Token invalid due to password change\"}");
                return;
            }
        }

        chain.doFilter(req, res);
    }
}
