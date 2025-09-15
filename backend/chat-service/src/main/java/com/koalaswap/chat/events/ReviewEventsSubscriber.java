package com.koalaswap.chat.events;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.koalaswap.chat.service.ChatDomainService;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Component;

@Component
public class ReviewEventsSubscriber implements MessageListener {

    private final ObjectMapper om;
    private final ChatDomainService chatDomainService;

    public ReviewEventsSubscriber(ChatDomainService chatDomainService) {
        this.chatDomainService = chatDomainService;
        this.om = new ObjectMapper();
        // 注册 JavaTimeModule 以支持 Java 8 时间类型
        this.om.registerModule(new JavaTimeModule());
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            String channel = new String(message.getChannel());
            String body = new String(message.getBody());

            System.out.println("[ReviewEventsSubscriber] Received message on channel: " + channel);
            System.out.println("[ReviewEventsSubscriber] Message body: " + body);

            if ("review-events".equals(channel)) {
                ReviewEvent event = om.readValue(body, ReviewEvent.class);
                System.out.println("[ReviewEventsSubscriber] Parsed ReviewEvent: " + event);

                chatDomainService.appendSystemMessageForReviewEvent(event);
            }
        } catch (Exception e) {
            System.err.println("[ReviewEventsSubscriber] Failed to process message: " + e.getMessage());
            e.printStackTrace();
        }
    }
}