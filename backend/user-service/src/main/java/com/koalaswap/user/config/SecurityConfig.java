// backend/user-service/src/main/java/com/koalaswap/user/config/SecurityConfig.java
package com.koalaswap.user.config;

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
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final JwtService jwtService;
    private final SecurityJsonHandlers handlers;
    private final TokenVersionProvider tokenVersionProvider;

    @Bean
    public TokenFreshnessFilter tokenFreshnessFilter() {
        return new TokenFreshnessFilter(jwtService, tokenVersionProvider);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(reg -> reg
                        .requestMatchers(HttpMethod.POST, "/api/auth/logout").authenticated()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/brief", "/api/users/*/brief").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/health/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/internal/**").permitAll() // 给内部探针放行
                        .anyRequest().authenticated()
                )
                .exceptionHandling(eh -> eh
                        .authenticationEntryPoint(handlers.json401())
                        .accessDeniedHandler(handlers.json403())
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(tokenFreshnessFilter(), JwtAuthFilter.class);

        return http.build();
    }
}
