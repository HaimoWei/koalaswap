package com.koalaswap.file.config;

import com.koalaswap.common.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * File Service 安全配置
 * 文件上传需要用户认证
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // 配置请求权限
            .authorizeHttpRequests(auth -> auth
                // 健康检查端点无需认证
                .requestMatchers("/actuator/**", "/health/**").permitAll()

                // 所有文件上传相关接口需要认证
                .requestMatchers("/api/files/**").authenticated()

                // Actuator health endpoint
                .requestMatchers("/actuator/health/**").permitAll()

                // 其他请求默认需要认证
                .anyRequest().authenticated()
            )

            // 添加 JWT 认证过滤器
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)

            .build();
    }
}