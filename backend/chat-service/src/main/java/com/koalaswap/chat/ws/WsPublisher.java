// src/main/java/com/koalaswap/chat/ws/WsPublisher.java
package com.koalaswap.chat.ws;

import com.koalaswap.chat.dto.ConversationResponse;
import com.koalaswap.chat.dto.MessageResponse;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class WsPublisher {

    private final SimpMessagingTemplate template;

    public WsPublisher(SimpMessagingTemplate template) {
        this.template = template;
    }

    /** 推送新的消息到会话订阅者 */
    public void publishNewMessage(UUID conversationId, MessageResponse payload) {
        String dest = "/topic/chat/conversations/" + conversationId;
        template.convertAndSend(dest, payload);
    }

    /** 可选：推送会话摘要更新（未读、last_message_* 变化）到个人队列 */
    public void publishMyInboxChanged(UUID userId, Object payload) {
        template.convertAndSendToUser(userId.toString(), "/queue/chat", payload);
    }
}
