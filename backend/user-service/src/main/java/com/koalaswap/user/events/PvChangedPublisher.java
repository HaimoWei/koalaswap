// backend/user-service/src/main/java/com/koalaswap/user/events/PvChangedPublisher.java
package com.koalaswap.user.events;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.koalaswap.common.security.TokenFreshnessProperties;
import com.koalaswap.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class PvChangedPublisher {

    private final StringRedisTemplate redis;
    private final UserRepository userRepo;
    private final TokenFreshnessProperties props;
    private final ObjectMapper om = new ObjectMapper();

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPvBumped(PvBumpedEvent evt) {
        var uid = evt.userId();
        int pv = userRepo.findTokenVersionById(uid).orElse(1);
        String key = "user:pv:" + uid;
        try {
            // 1) 写入 Redis（L2 权威，不设 TTL）
            redis.opsForValue().set(key, Integer.toString(pv));
            // 2) 发布 Pub/Sub
            String payload = om.createObjectNode()
                    .put("uid", uid.toString())
                    .put("pv", pv)
                    .toString();
            redis.convertAndSend(props.getPubsubChannel(), payload);
            log.debug("PV changed published: uid={} pv={} key={} channel={}", uid, pv, key, props.getPubsubChannel());
        } catch (Exception e) {
            log.warn("Publish pv change failed: uid={} pv={} err={}", uid, pv, e.getClass().getSimpleName());
        }
    }
}
