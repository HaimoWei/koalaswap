// backend/product-service/src/main/java/com/koalaswap/product/security/PvChangedSubscriber.java
package com.koalaswap.product.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.koalaswap.common.security.TokenVersionCache;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class PvChangedSubscriber {

    private final TokenVersionCache l1;
    private final ObjectMapper om = new ObjectMapper();

    /** RedisMessageListenerAdapter 会调用该方法（见 RedisSubscriberConfig） */
    public void onMessage(String raw) throws Exception {
        JsonNode node = om.readTree(raw);
        String uidStr = node.path("uid").asText(null);
        int pv = node.path("pv").asInt(-1);
        if (uidStr == null || pv < 0) {
            log.warn("Ignore pv-change message (bad payload): {}", raw);
            return;
        }
        UUID uid = UUID.fromString(uidStr);

        // 策略 A：失效 L1（下次必 miss）
        l1.invalidate(uid);
        // 策略 B（可选）：也可以直接回填最新 pv
        // l1.put(uid, pv);

        log.debug("L1 invalidated by pubsub: uid={} pv={}", uid, pv);
    }
}
