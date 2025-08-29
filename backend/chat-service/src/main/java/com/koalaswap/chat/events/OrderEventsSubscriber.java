// src/main/java/com/koalaswap/chat/events/OrderEventsSubscriber.java
package com.koalaswap.chat.events;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.koalaswap.chat.entity.Message;
import com.koalaswap.chat.model.MessageType;
import com.koalaswap.chat.model.SystemEvent;
import com.koalaswap.chat.service.ChatDomainService;
import com.koalaswap.chat.ws.WsPublisher;
import com.koalaswap.chat.dto.MessageResponse;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class OrderEventsSubscriber implements MessageListener {

    private final ObjectMapper om = new ObjectMapper();
    private final ChatDomainService chatDomain;
    private final WsPublisher ws;

    public OrderEventsSubscriber(ChatDomainService chatDomain, WsPublisher ws) {
        this.chatDomain = chatDomain; this.ws = ws;
    }

    @Override
    public void onMessage(org.springframework.data.redis.connection.Message message, byte[] pattern) {
        try {
            String json = new String(message.getBody());
            OrderStatusEvent evt = om.readValue(json, OrderStatusEvent.class);

            // 将订单事件转为 SYSTEM 消息落库，并刷新会话快照/未读
            var saved = chatDomain.appendSystemMessageForOrderEvent(evt);

            // 推送到会话 topic
            var resp = new MessageResponse(
                    saved.getId(), saved.getType(), saved.getSenderId(),
                    saved.getBody(), saved.getImageUrl(), saved.getSystemEvent(),
                    saved.getMeta(), saved.getCreatedAt()
            );
            ws.publishNewMessage(saved.getConversationId(), resp);

            // （可选）推送“我的收件箱发生变化”给双方
            // chatDomain.getConversation(saved.getConversationId()) -> 取 buyer/seller 并各自推送未读变化
        } catch (Exception e) {
            // 记录日志即可；为简洁未引入日志框架
            e.printStackTrace();
        }
    }
}
