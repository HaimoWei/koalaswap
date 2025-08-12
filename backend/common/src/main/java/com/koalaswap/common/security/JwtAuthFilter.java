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
// ... 省略 import
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String auth = request.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            log.trace("No Bearer header for {} {}", request.getMethod(), request.getRequestURI());
            chain.doFilter(request, response);
            return;
        }

        String token = auth.substring(7).trim();
        try {
            var jws = jwtService.parse(token);
            var claims = jws.getBody();
            var sub = claims.getSubject();               // 统一以 sub 作为用户ID
            var userId = UUID.fromString(sub);

            var authentication = new UsernamePasswordAuthenticationToken(userId.toString(), null, List.of());
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);

            log.debug("JWT OK for {} {} (sub={})", request.getMethod(), request.getRequestURI(), sub);
        } catch (Exception ex) {
            // 不打印 token，避免泄露
            log.warn("JWT parse failed for {} {}: {}", request.getMethod(), request.getRequestURI(), ex.getClass().getSimpleName());
            SecurityContextHolder.clearContext();
        }
        chain.doFilter(request, response);
    }

    /**（可选）在 SecurityContext 里的用户信息载体 */
    public record AuthUser(UUID id, String email) {}
}