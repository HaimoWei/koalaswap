package com.koalaswap.review.config;

import com.koalaswap.common.security.TokenFreshnessProperties;
import com.koalaswap.review.events.OrderCompletedSubscriber;
import com.koalaswap.review.security.PvChangedSubscriber;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;

/** 按你项目既有风格，拆成两个容器，避免多个 MessageListenerAdapter 注入歧义 */
@Configuration
@RequiredArgsConstructor
public class RedisSubscriberConfig {

    private final TokenFreshnessProperties props;

    @Value("${app.order-events.channel:orders:completed}")
    private String orderCompletedChannel;

    /* 1) 订阅 token 新鲜度（L1 失效） */
    @Bean
    public RedisMessageListenerContainer pvRedisContainer(
            RedisConnectionFactory cf,
            MessageListenerAdapter pvListenerAdapter
    ) {
        var c = new RedisMessageListenerContainer();
        c.setConnectionFactory(cf);
        c.addMessageListener(pvListenerAdapter, new PatternTopic(props.getPubsubChannel()));
        return c;
    }

    @Bean
    public MessageListenerAdapter pvListenerAdapter(PvChangedSubscriber subscriber) {
        return new MessageListenerAdapter(subscriber, "onMessage");
    }

    /* 2) 订阅订单完成事件（创建待评价槽位） */
    @Bean
    public RedisMessageListenerContainer orderCompletedRedisContainer(
            RedisConnectionFactory cf,
            MessageListenerAdapter orderCompletedListenerAdapter
    ) {
        var c = new RedisMessageListenerContainer();
        c.setConnectionFactory(cf);
        c.addMessageListener(orderCompletedListenerAdapter, new PatternTopic(orderCompletedChannel));
        return c;
    }

    @Bean
    public MessageListenerAdapter orderCompletedListenerAdapter(OrderCompletedSubscriber subscriber) {
        return new MessageListenerAdapter(subscriber, "onMessage");
    }
}
