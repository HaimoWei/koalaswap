// src/main/java/com/koalaswap/chat/service/RateLimitService.java
package com.koalaswap.chat.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;

@Service
public class RateLimitService {
    private static final long WINDOW_MS = TimeUnit.SECONDS.toMillis(2);
    private final Map<String, Long> last = new ConcurrentHashMap<>();

    /** key = conversationId:userId */
    public boolean allowSend(String key) {
        long now = Instant.now().toEpochMilli();
        Long prev = last.get(key);
        if (prev == null || now - prev >= WINDOW_MS) {
            last.put(key, now);
            return true;
        }
        return false;
    }
}
