// src/main/java/com/koalaswap/chat/security/StompAuthChannelInterceptor.java
package com.koalaswap.chat.security;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@Component
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            try {
                // 优先：从 Spring Security 取
                var uid = CurrentUser.idRequired();
                accessor.setUser(new SimplePrincipal(uid.toString()));
            } catch (Exception e) {
                // 兜底：从 header: uid 取（仅限内网/测试）
                List<String> uids = accessor.getNativeHeader("uid");
                if (uids == null || uids.isEmpty()) throw e;
                try {
                    UUID.fromString(uids.get(0)); // 校验 UUID 格式
                    accessor.setUser(new SimplePrincipal(uids.get(0)));
                } catch (Exception ex) { throw e; }
            }
        }
        return message;
    }

    static class SimplePrincipal implements Principal {
        private final String name;
        SimplePrincipal(String name) { this.name = name; }
        @Override public String getName() { return name; }
    }
}
