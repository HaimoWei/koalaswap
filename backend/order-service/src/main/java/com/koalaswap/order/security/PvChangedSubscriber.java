package com.koalaswap.order.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.koalaswap.common.security.TokenVersionCache;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

/** 收到 {uid, pv} 后，直接失效 L1，下一次将回源校验 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PvChangedSubscriber {
    private final TokenVersionCache l1;
    private final ObjectMapper om = new ObjectMapper();

    public void onMessage(String raw) {
        try {
            JsonNode node = om.readTree(raw);
            UUID uid = UUID.fromString(node.path("uid").asText());
            int pv = node.path("pv").asInt();
            log.debug("pv-change: uid={}, pv={}", uid, pv);
            l1.invalidate(uid); // 或直接 l1.put(uid, pv)
        } catch (Exception e) {
            log.warn("Ignore pv-change message: {}", e.toString());
        }
    }
}
