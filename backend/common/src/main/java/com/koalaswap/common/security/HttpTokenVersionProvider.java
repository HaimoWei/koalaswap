package com.koalaswap.common.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.UUID;

/**
 * 通过调用 user-service 内部接口获取 token 版本号。
 * [MODIFIED] 改为复用共享的 L1（TokenVersionCache），不在类内自建 LoadingCache。
 * 启用条件：app.tokenFreshness.useRedis=false（或缺省）且存在 app.userService.internalBaseUrl。
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.token-freshness", name = "use-redis", havingValue = "false", matchIfMissing = true)
public class HttpTokenVersionProvider implements TokenVersionProvider {

    private final RestClient rest = RestClient.create();
    private final TokenVersionCache l1; // [ADDED]

    @Value("${app.user-service.internal-base-url}")
    private String userServiceBaseUrl; // 例：http://localhost:12649

    @Override
    public int currentVersion(UUID userId) {
        Integer cached = l1.getIfPresent(userId); // [ADDED]
        if (cached != null) return cached;       // [ADDED]
        int pv = safeLoad(userId);               // [ADDED]
        l1.put(userId, pv);                      // [ADDED]
        return pv;                               // [ADDED]
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
