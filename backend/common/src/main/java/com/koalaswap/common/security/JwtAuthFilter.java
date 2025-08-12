// backend/common/src/main/java/com/koalaswap/common/security/JwtAuthFilter.java
package com.koalaswap.common.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService; // common 里的 JwtService

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String auth = request.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            // 没带 Bearer 就直接放行（匿名访问交给 SecurityConfig 决定）
            // 用 TRACE 避免刷屏
            log.trace("No Bearer header for {} {}", request.getMethod(), request.getRequestURI());
            filterChain.doFilter(request, response);
            return;
        }

        String token = auth.substring(7).trim();
        try {
            var jws = jwtService.parse(token);     // Jws<Claims>
            Claims claims = jws.getBody();

            // 字段名与签发时保持一致：优先 uid，兜底 sub
            String uidStr = claims.get("uid", String.class);
            String sub = claims.getSubject();
            UUID userId = (uidStr != null && !uidStr.isBlank())
                    ? UUID.fromString(uidStr)
                    : UUID.fromString(sub);

            var authentication = new UsernamePasswordAuthenticationToken(
                    userId.toString(), null, List.of()
            );
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);

            log.debug("JWT OK for {} {} (uid={}, sub={})",
                    request.getMethod(), request.getRequestURI(), userId, sub);

        } catch (Exception ex) {
            // 解析失败：清空上下文，继续链路，让后续返回 401/403
            String prefix = token.isEmpty() ? "" : token.substring(0, Math.min(12, token.length())) + "...";
            log.warn("JWT parse failed for {} {}: {} (token={})",
                    request.getMethod(), request.getRequestURI(),
                    ex.getClass().getSimpleName(), prefix);
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    /**（可选）在 SecurityContext 里的用户信息载体 */
    public record AuthUser(UUID id, String email) {}
}
