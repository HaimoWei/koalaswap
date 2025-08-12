package com.koalaswap.common.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * 全服务“令牌新鲜度”校验：
 * 读取 JWT 的 pv（token 版本号）对比当前真实版本，不一致则清空认证（后续返回 401）。
 * 放在 JwtAuthFilter 之后。
 */
@Slf4j
@RequiredArgsConstructor
public class TokenFreshnessFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final TokenVersionProvider provider;

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        var ctx = SecurityContextHolder.getContext();
        var auth = ctx.getAuthentication();
        if (auth == null || auth.getName() == null) { chain.doFilter(req, res); return; }

        String header = req.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) { chain.doFilter(req, res); return; }

        try {
            var claims = jwtService.parse(header.substring(7).trim()).getBody();
            Integer pv = claims.get("pv", Integer.class);   // 令牌里的版本号
            UUID userId = UUID.fromString(auth.getName());
            int current = provider.currentVersion(userId);

            // 兼容旧 token（无 pv）：先放行；若想强制失效可改成 (pv == null || pv < current)
            if (pv == null || pv < current) {
                log.info("Token freshness fail: uid={}, pv(token)={}, pv(current)={}", userId, pv, current);
                SecurityContextHolder.clearContext();
            }
        } catch (Exception e) {
            log.warn("Token freshness check error: {}", e.getClass().getSimpleName());
            SecurityContextHolder.clearContext();
        }

        chain.doFilter(req, res);
    }
}
