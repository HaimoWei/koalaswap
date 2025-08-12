// backend/user-service/src/main/java/com/koalaswap/user/config/SecurityConfig.java
package com.koalaswap.user.config;

import com.koalaswap.common.security.JwtAuthFilter;
import com.koalaswap.common.security.JwtService;
import com.koalaswap.common.security.SecurityJsonHandlers;  // ✅ 新增：统一 401/403 JSON
import com.koalaswap.user.repository.UserRepository;
import com.koalaswap.user.security.PasswordFreshnessFilter;
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

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final SecurityJsonHandlers handlers;       // ✅ 新增注入

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /** “旧 Token 失效”过滤器（密码修改后旧 token 失效） */
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

                // 3) 统一未认证/无权限响应（复用 common 里的 handlers）
                .exceptionHandling(eh -> eh
                        .authenticationEntryPoint(handlers.json401())  // 未认证 → 401 JSON
                        .accessDeniedHandler(handlers.json403())       // 无权限 → 403 JSON
                )

                // 4) 过滤器顺序：先 JWT，再旧 Token 失效校验
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(passwordFreshnessFilter(), JwtAuthFilter.class);

        return http.build();
    }
}
