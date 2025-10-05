package com.koalaswap.order.config;

import com.koalaswap.common.security.JwtAuthFilter;
import com.koalaswap.common.security.SecurityJsonHandlers;
import com.koalaswap.common.security.TokenFreshnessFilter;
import com.koalaswap.common.security.TokenVersionProvider;
import com.koalaswap.common.security.JwtService;
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
 * - 全部 /api/orders/** 需要登录
 * - /api/internal/** 与 /api/health/** 放行（内部检查靠网络/网关，或后续加服务间鉴权）
 * - 统一 401/403 JSON
 */
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final SecurityJsonHandlers handlers;
    private final JwtService jwtService;
    private final TokenVersionProvider tokenVersionProvider;

    @Bean
    public TokenFreshnessFilter tokenFreshnessFilter() {
        // 令牌新鲜度校验（pv 对比）
        return new TokenFreshnessFilter(jwtService, tokenVersionProvider);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/health/**").permitAll()
                        .requestMatchers("/api/internal/**").permitAll()
                        .requestMatchers("/api/orders/**").authenticated()
                        .requestMatchers("/actuator/health/**").permitAll()
                        .anyRequest().authenticated()
                )
                .exceptionHandling(eh -> eh
                        .authenticationEntryPoint(handlers.json401())
                        .accessDeniedHandler(handlers.json403()))
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(tokenFreshnessFilter(), JwtAuthFilter.class);
        return http.build();
    }
}
