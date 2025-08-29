// src/main/java/com/koalaswap/chat/config/RedisListenerConfig.java
package com.koalaswap.chat.config;

import com.koalaswap.chat.events.OrderEventsSubscriber;
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

    @Bean
    public RedisMessageListenerContainer container(RedisConnectionFactory factory,
                                                   OrderEventsSubscriber orderSubscriber) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(factory);
        container.addMessageListener(orderSubscriber, new ChannelTopic(ordersChannel));
        return container;
    }
}
