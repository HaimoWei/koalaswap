package com.koalaswap.chat.ws;

import com.koalaswap.chat.dto.MessageResponse;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;
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
        // 你当前前端已兼容“裸 MessageResponse”，保持不包 data
        template.convertAndSend(dest, payload);
    }

    /** 可选：推送会话摘要更新（未读、last_message_* 变化）到个人队列 */
    public void publishMyInboxChanged(UUID userId, Object payload) {
        template.convertAndSendToUser(userId.toString(), "/queue/chat", payload);
    }

    /** ✅ 新增：推送读回执（/topic/chat/conversations/{id}/read） */
    public void publishRead(UUID conversationId, UUID readerId, UUID readTo) {
        String dest = "/topic/chat/conversations/" + conversationId + "/read";
        template.convertAndSend(dest, Map.of(
                "readerId", readerId.toString(),
                "readTo", readTo == null ? null : readTo.toString()
        ));
    }
}
