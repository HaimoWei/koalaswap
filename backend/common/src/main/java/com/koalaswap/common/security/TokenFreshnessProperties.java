// backend/common/src/main/java/com/koalaswap/common/security/TokenFreshnessProperties.java
package com.koalaswap.common.security;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component // 直接注册为 Bean
@ConfigurationProperties(prefix = "app.token-freshness")
public class TokenFreshnessProperties {
    /** L1 缓存 TTL（秒），默认 8 */
    private int cacheTtlSec = 8;

    /** 是否启用 Redis（true=使用 RedisTokenVersionProvider；false=HttpTokenVersionProvider） */
    private boolean useRedis = false;

    /** Redis Pub/Sub 频道名 */
    private String pubsubChannel = "auth:pv:changed";
}
