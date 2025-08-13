// backend/common/src/main/java/com/koalaswap/common/security/TokenVersionCache.java
package com.koalaswap.common.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class TokenVersionCache {

    private final TokenFreshnessProperties props;

    private Cache<UUID, Integer> l1;

    @PostConstruct
    void init() {
        l1 = Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofSeconds(Math.max(0, props.getCacheTtlSec())))
                .maximumSize(100_000)
                .build();
    }

    public Integer getIfPresent(UUID uid) { return l1.getIfPresent(uid); }

    public void put(UUID uid, int pv) { l1.put(uid, pv); }

    public void invalidate(UUID uid) { l1.invalidate(uid); }
}
