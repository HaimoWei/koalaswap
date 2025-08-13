// backend/common/src/main/java/com/koalaswap/common/security/RedisTokenVersionProvider.java
package com.koalaswap.common.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.token-freshness", name = "use-redis", havingValue = "true")
public class RedisTokenVersionProvider implements TokenVersionProvider {

    private final TokenVersionCache l1;
    private final StringRedisTemplate redis;
    private final TokenFreshnessProperties props;

    // 回退 HTTP（依然调用 user-service 内部接口）
    private final RestClient rest = RestClient.create();

    // user-service 内部地址（用于 HTTP 回退）
    @org.springframework.beans.factory.annotation.Value("${app.user-service.internal-base-url}")
    private String userServiceBaseUrl;

    private static String key(UUID uid) {
        return "user:pv:" + uid;
    }

    @Override
    public int currentVersion(UUID uid) {
        Integer cached = l1.getIfPresent(uid);
        if (cached != null) return cached;

        // 1) 先查 Redis（L2）
        try {
            String v = redis.opsForValue().get(key(uid));
            if (v != null) {
                int pv = Integer.parseInt(v);
                l1.put(uid, pv);
                return pv;
            }
        } catch (Exception e) {
            log.warn("Redis read failed, fallback to HTTP. uid={}, ex={}", uid, e.getClass().getSimpleName());
        }

        // 2) 回退 HTTP 调 user-service
        int pv = httpFetch(uid);

        // 3) 回填（尽力而为）
        try { redis.opsForValue().set(key(uid), Integer.toString(pv)); } catch (Exception ignored) {}
        l1.put(uid, pv);
        return pv;
    }

    private int httpFetch(UUID uid) {
        try {
            Integer v = rest.get()
                    .uri(userServiceBaseUrl.replaceAll("/+$","") + "/api/internal/users/{id}/token-version", uid)
                    .header(HttpHeaders.ACCEPT, "application/json")
                    .retrieve()
                    .body(Integer.class);
            return (v == null ? 1 : v);
        } catch (Exception e) {
            log.warn("HTTP fallback failed for {}: {}", uid, e.getClass().getSimpleName());
            return 1; // 宽松降级（可按需收紧）
        }
    }
}
