package com.koalaswap.common.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * 从 Authorization: Bearer <token> 读取 JWT → 验签解析 → 注入认证上下文。
 * 放在各服务的 SecurityFilterChain 中（在 UsernamePasswordAuthenticationFilter 之前）。
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService; // 你在 common 里的 JwtService

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String auth = request.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = auth.substring(7).trim();
        try {
            // 验签 + 解析
            var jws = jwtService.parse(token);   // Jws<Claims>
            var claims = jws.getBody();          // Claims

            // 这两个字段名要和 JwtService 签发时保持一致
            UUID userId;
            String uidStr = claims.get("uid", String.class);
            if (uidStr != null && !uidStr.isBlank()) {
                userId = UUID.fromString(uidStr);
            } else {
                userId = UUID.fromString(claims.getSubject()); // 兜底：用 sub
            }
            String email = claims.get("email", String.class);

            // 构建认证对象（principal 直接放 userId 字符串，后续取更方便）
            var authentication = new UsernamePasswordAuthenticationToken(
                    userId.toString(), null, java.util.List.of()
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (Exception ex) {
            // token 无效/过期/篡改：不设置认证，继续走，让后面的链路返回 401/403
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    /** 放在 SecurityContext 里的用户信息载体（你也可以用自己的 Principal 类） */
    public record AuthUser(UUID id, String email) {}
}
