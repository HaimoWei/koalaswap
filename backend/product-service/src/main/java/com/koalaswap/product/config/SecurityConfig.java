// ===============================
// backend/product-service/src/main/java/com/koalaswap/product/config/SecurityConfig.java
// 安全配置｜GET 浏览放行；写操作需要登录；串入 JwtAuthFilter
// ===============================
package com.koalaswap.product.config;

import com.koalaswap.common.security.JwtAuthFilter;
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
 * 安全基线
 * 1) 公开：GET /api/products/**（详情/列表将来都支持匿名浏览）
 * 2) 受保护：POST/PATCH/DELETE 等写操作（发布/修改/删除）
 * 3) 统一无状态会话；插入 JwtAuthFilter（解析 Authorization: Bearer ...）
 */
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // 公开浏览：详情/列表/后面会有搜索
                        .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                        .requestMatchers("/api/health/**").permitAll()

                        // 写操作：全部需要登录（发布 / 修改 / 删除）
                        .requestMatchers(HttpMethod.POST,   "/api/products/**").authenticated()
                        .requestMatchers(HttpMethod.PATCH,  "/api/products/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/products/**").authenticated()

                        // 兜底：其余默认鉴权
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
