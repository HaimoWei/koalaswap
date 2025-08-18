package com.koalaswap.order.config;

import com.koalaswap.common.security.TokenFreshnessProperties;
import com.koalaswap.order.security.PvChangedSubscriber;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;

/** 订阅 user-service 发布的“令牌版本变更”消息，用于秒级失效 L1 缓存 */
@Configuration
@RequiredArgsConstructor
public class RedisSubscriberConfig {

    private final TokenFreshnessProperties props;

    @Bean
    public RedisMessageListenerContainer redisContainer(
            RedisConnectionFactory cf,
            MessageListenerAdapter listenerAdapter
    ) {
        var c = new RedisMessageListenerContainer();
        c.setConnectionFactory(cf);
        c.addMessageListener(listenerAdapter, new PatternTopic(props.getPubsubChannel()));
        return c;
    }

    @Bean
    public MessageListenerAdapter messageListenerAdapter(PvChangedSubscriber subscriber) {
        // 订阅者方法名：onMessage(String)
        return new MessageListenerAdapter(subscriber, "onMessage");
    }
}
