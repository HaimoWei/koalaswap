package com.koalaswap.chat.config;

import com.koalaswap.common.security.JwtAuthFilter;
import com.koalaswap.common.security.JwtService;
import com.koalaswap.common.security.SecurityJsonHandlers;
import com.koalaswap.common.security.TokenFreshnessFilter;
import com.koalaswap.common.security.TokenVersionProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * 与其它微服务（order/product/review/user）的 SecurityConfig 风格保持一致：
 * - 统一用 common 安全栈（JwtAuthFilter + TokenFreshnessFilter）
 * - 放行 /api/health/**、/api/internal/**、WebSocket 握手端点 /ws/chat/**
 * - 其余 /api/chat/** 需要鉴权
 */
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final JwtService jwtService;
    private final TokenVersionProvider tokenVersionProvider;
    private final SecurityJsonHandlers handlers;

    @Bean
    public TokenFreshnessFilter tokenFreshnessFilter() {
        // 与其它服务一致：依赖 common 的 provider & properties（由 application(-local).yml 提供）
        return new TokenFreshnessFilter(jwtService, tokenVersionProvider);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 与其它服务一致：无状态 Session
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth
                        // 健康&内部探针
                        .requestMatchers("/api/health/**").permitAll()
                        .requestMatchers("/api/internal/**").permitAll()
                        // WebSocket 握手与 SockJS
                        .requestMatchers("/ws/chat/**").permitAll()
                        // 静态资源 & 预检
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/", "/index.html", "/static/**", "/assets/**").permitAll()
                        // 其余聊天接口必须认证
                        .requestMatchers("/api/chat/**").authenticated()
                        .requestMatchers("/actuator/health/**").permitAll()
                        .anyRequest().authenticated()
                )
                .exceptionHandling(eh -> eh
                        .authenticationEntryPoint(handlers.json401())
                        .accessDeniedHandler(handlers.json403())
                )
                // 过滤器顺序与其它微服务一致
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(tokenFreshnessFilter(), JwtAuthFilter.class);

        return http.build();
    }
}
