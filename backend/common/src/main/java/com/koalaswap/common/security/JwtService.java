package com.koalaswap.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

/**
 * JWT 工具（HS256）：
 * - 生成 access token（仅在 user-service 登录成功时使用）
 * - 解析并校验：签名 + 过期
 */
@Component
public class JwtService {
    private final Key key;             // HS256 对称密钥
    private final long accessTtlMs;    // 访问令牌有效期（毫秒）

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.accessTtlMs:900000}") long accessTtlMs  // 默认 15 分钟
    ) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalArgumentException("JWT secret too short: require >= 32 bytes");
        }
        this.key = Keys.hmacShaKeyFor(bytes);
        this.accessTtlMs = accessTtlMs;
    }

    /** 生成 Access Token：sub=用户ID，附带常用 email claim（仅 user-service 调用） */
    public String generateAccessToken(UUID userId, String email) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setSubject(userId.toString())                    // sub：用户ID
                .setIssuedAt(new Date(now))                       // iat
                .setExpiration(new Date(now + accessTtlMs))       // exp
                .addClaims(Map.of("email", email))                // 自定义 claims
                .signWith(key, SignatureAlgorithm.HS256)          // HS256 签名
                .compact();
    }

    /** 解析 + 验签 + 过期检查；无效则抛异常（交由上层统一处理） */
    public Jws<Claims> parse(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .setAllowedClockSkewSeconds(60) // 容忍 60s 时钟偏移
                .build()
                .parseClaimsJws(token);
    }

    /** 便捷：从 token 里取 userId（sub） */
    public UUID getUserId(String token) {
        return UUID.fromString(parse(token).getBody().getSubject());
    }

    /** 便捷：从 token 里取签发时间 iat（没有则返回 EPOCH） */
    public Instant getIssuedAt(String token) {
        Date iat = parse(token).getBody().getIssuedAt();
        return (iat == null) ? Instant.EPOCH : iat.toInstant();
    }
}
