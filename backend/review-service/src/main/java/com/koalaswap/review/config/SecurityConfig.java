package com.koalaswap.review.config;

import com.koalaswap.common.security.JwtAuthFilter;
import com.koalaswap.common.security.JwtService;
import com.koalaswap.common.security.SecurityJsonHandlers;
import com.koalaswap.common.security.TokenFreshnessFilter;
import com.koalaswap.common.security.TokenVersionProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final SecurityJsonHandlers handlers;
    // 关键：按你的其它服务保持一致，注入 JwtService 与 TokenVersionProvider
    private final JwtService jwtService;
    private final TokenVersionProvider tokenVersionProvider;

    @Bean
    public TokenFreshnessFilter tokenFreshnessFilter() {
        // 关键修复点：传入两个依赖
        return new TokenFreshnessFilter(jwtService, tokenVersionProvider);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/health/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reviews/users/**").permitAll() // 用户主页评价公开
                        .requestMatchers("/api/reviews/**").authenticated()
                        .requestMatchers("/actuator/health/**").permitAll()
                        .anyRequest().authenticated()
                )
                .exceptionHandling(eh -> eh
                        .authenticationEntryPoint(handlers.json401())
                        .accessDeniedHandler(handlers.json403())
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                // 注意：这里调用无参的 bean 方法
                .addFilterAfter(tokenFreshnessFilter(), JwtAuthFilter.class);

        return http.build();
    }
}
