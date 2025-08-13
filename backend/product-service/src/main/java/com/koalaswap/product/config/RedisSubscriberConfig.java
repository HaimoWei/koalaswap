// backend/product-service/src/main/java/com/koalaswap/product/config/RedisSubscriberConfig.java
package com.koalaswap.product.config;

import com.koalaswap.common.security.TokenFreshnessProperties;
import com.koalaswap.product.security.PvChangedSubscriber;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;

@Configuration
@RequiredArgsConstructor
public class RedisSubscriberConfig {

    private final TokenFreshnessProperties props;

    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(
            RedisConnectionFactory cf,
            MessageListenerAdapter listenerAdapter
    ) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(cf);
        container.addMessageListener(listenerAdapter, new PatternTopic(props.getPubsubChannel()));
        return container;
    }

    @Bean
    public MessageListenerAdapter messageListenerAdapter(PvChangedSubscriber subscriber) {
        // 订阅者的“onMessage(String)”方法
        return new MessageListenerAdapter(subscriber, "onMessage");
    }
}
