package com.koalaswap.review.security;

import com.fasterxml.jackson.databind.*;
import com.koalaswap.common.security.TokenVersionCache;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import java.util.UUID;

@Slf4j @Component @RequiredArgsConstructor
public class PvChangedSubscriber {
    private final TokenVersionCache l1;
    private final ObjectMapper om = new ObjectMapper();

    public void onMessage(String raw) {
        try {
            JsonNode n = om.readTree(raw);
            UUID uid = UUID.fromString(n.path("uid").asText());
            l1.invalidate(uid);
        } catch (Exception e) {
            log.warn("Ignore pv-change message: {}", e.toString());
        }
    }
}
