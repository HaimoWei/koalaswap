package com.koalaswap.common.security;

import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.LoadingCache;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.UUID;

/**
 * 通过调用 user-service 内部接口获取 token 版本号，并做短期本地缓存。
 * - TTL 可配置（秒），默认 8s；设置为 0 可禁用缓存（每次直连 user-service）。
 */
@Slf4j
@Component
@ConditionalOnProperty(prefix = "app.userService", name = "internalBaseUrl")
public class HttpTokenVersionProvider implements TokenVersionProvider {

    private final RestClient rest = RestClient.create();

    @Value("${app.userService.internalBaseUrl}")
    private String userServiceBaseUrl; // 例：http://localhost:12649

    /** 本地缓存 TTL，单位秒；默认 8。设为 0 表示不缓存（每次直连） */
    @Value("${app.tokenFreshness.cacheTtlSec:8}")
    private int cacheTtlSec;

    private LoadingCache<UUID, Integer> cache;

    @PostConstruct
    void initCache() {
        if (cacheTtlSec > 0) {
            this.cache = Caffeine.newBuilder()
                    .expireAfterWrite(Duration.ofSeconds(cacheTtlSec))
                    .maximumSize(100_000)
                    .build(this::loadFromUserService);
            log.info("TokenVersionProvider cache enabled: {}s TTL", cacheTtlSec);
        } else {
            this.cache = null;
            log.info("TokenVersionProvider cache disabled (cacheTtlSec = 0)");
        }
    }

    @Override
    public int currentVersion(UUID userId) {
        if (cache == null) {
            return safeLoad(userId);
        }
        return cache.get(userId);
    }

    private Integer loadFromUserService(UUID userId) {
        Integer v = rest.get()
                .uri(userServiceBaseUrl.replaceAll("/+$","") + "/api/internal/users/{id}/token-version", userId)
                .header(HttpHeaders.ACCEPT, "application/json")
                .retrieve()
                .body(Integer.class);
        return (v == null ? 1 : v);
    }

    private int safeLoad(UUID userId) {
        try {
            return loadFromUserService(userId);
        } catch (Exception e) {
            // 失败降级：返回 1（放行）。如要“失败即收紧”，可改为返回 Integer.MAX_VALUE。
            log.warn("Load token version failed for {}: {}", userId, e.getClass().getSimpleName());
            return 1;
        }
    }
}
