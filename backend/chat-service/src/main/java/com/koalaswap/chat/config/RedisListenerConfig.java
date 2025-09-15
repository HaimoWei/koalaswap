// src/main/java/com/koalaswap/chat/config/RedisListenerConfig.java
package com.koalaswap.chat.config;

import com.koalaswap.chat.events.OrderEventsSubscriber;
import com.koalaswap.chat.events.ReviewEventsSubscriber;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

@Configuration
public class RedisListenerConfig {

    @Value("${chat.order.redis-channel:orders:status-changed}")
    private String ordersChannel;

    @Value("${chat.review.redis-channel:review-events}")
    private String reviewsChannel;

    @Bean
    public RedisMessageListenerContainer container(RedisConnectionFactory factory,
                                                   OrderEventsSubscriber orderSubscriber,
                                                   ReviewEventsSubscriber reviewSubscriber) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(factory);
        container.addMessageListener(orderSubscriber, new ChannelTopic(ordersChannel));
        container.addMessageListener(reviewSubscriber, new ChannelTopic(reviewsChannel));

        System.out.println("[RedisListenerConfig] 配置Redis订阅:");
        System.out.println("  - 订单频道: " + ordersChannel);
        System.out.println("  - 评价频道: " + reviewsChannel);

        return container;
    }
}
