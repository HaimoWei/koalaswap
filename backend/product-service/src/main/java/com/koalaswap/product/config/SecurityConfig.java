package com.koalaswap.product.config;

import com.koalaswap.common.security.JwtAuthFilter;
import com.koalaswap.common.security.SecurityJsonHandlers;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import com.koalaswap.common.security.TokenFreshnessFilter;
import com.koalaswap.common.security.TokenVersionProvider;
import com.koalaswap.common.security.JwtService;

/**
 * 产品服务安全配置：
 * - GET /api/products/** 公开
 * - 写操作需登录
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
        return new TokenFreshnessFilter(jwtService, tokenVersionProvider);
    }


    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()  // 分类查询公开
                        .requestMatchers("/api/health/**").permitAll()
                        .requestMatchers("/api/internal/**").permitAll()
                        .requestMatchers(HttpMethod.POST,   "/api/products/**").authenticated()
                        .requestMatchers(HttpMethod.PATCH,  "/api/products/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/products/**").authenticated()
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
