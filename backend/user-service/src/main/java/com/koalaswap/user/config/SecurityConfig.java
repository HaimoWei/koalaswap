package com.koalaswap.user.config;

import com.koalaswap.common.security.JwtAuthFilter; // 来自 common 模块
import com.koalaswap.common.security.JwtService;        // 新增：用来读取 iat
import com.koalaswap.user.repository.UserRepository;    // 新增：查询 password_updated_at
import com.koalaswap.user.security.PasswordFreshnessFilter; // 新增：我们写的“旧token失效”过滤器
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * 本服务的权限/安全配置（JWT版）：
 * - /api/auth/** 放行（注册/登录/邮箱验证/重发）
 * - /api/health/** 放行（健康检查）
 * - 其余接口默认需要登录
 * - 串入 JwtAuthFilter 完成 Bearer 验签与认证上下文注入
 * - 无状态会话（JWT）
 * - 按企业规范区分：未认证返回 401；已认证但无权限返回 403
 */
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final JwtService jwtService;                // 新增注入
    private final UserRepository userRepository;        // 新增注入

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(); // 默认强度 10
    }

    /** 把“旧 Token 失效”过滤器注册为 Bean */
    @Bean
    public PasswordFreshnessFilter passwordFreshnessFilter() {
        return new PasswordFreshnessFilter(jwtService, userRepository);
    }
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 1) 基本安全基线
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 2) 鉴权规则
                .authorizeHttpRequests(reg -> reg
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/health/**").permitAll()
                        .anyRequest().authenticated()
                )

                // 3) 统一未认证/无权限响应（企业规范）
                .exceptionHandling(eh -> eh
                        // 未认证（没带或无效 token）→ 401
                        .authenticationEntryPoint((req, res, ex) -> {
                            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            res.setContentType("application/json;charset=UTF-8");
                            res.getWriter().write("{\"code\":401,\"message\":\"Unauthorized\"}");
                        })
                        // 已认证但权限不足 → 403
                        .accessDeniedHandler((req, res, ex) -> {
                            res.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            res.setContentType("application/json;charset=UTF-8");
                            res.getWriter().write("{\"code\":403,\"message\":\"Forbidden\"}");
                        })
                )

                // 4) 在用户名密码过滤器之前插入 JWT 过滤器
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(passwordFreshnessFilter(), JwtAuthFilter.class);

        return http.build();
    }
}
