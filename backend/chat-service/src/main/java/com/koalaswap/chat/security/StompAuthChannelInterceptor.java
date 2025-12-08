// src/main/java/com/koalaswap/chat/security/StompAuthChannelInterceptor.java
package com.koalaswap.chat.security;

import com.koalaswap.common.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

/**
 * 企业级WebSocket认证拦截器
 * 支持多种认证方式：Spring Security上下文 -> JWT Token -> 开发环境UID Header
 */
@Component
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private static final Logger log = LoggerFactory.getLogger(StompAuthChannelInterceptor.class);
    
    private final JwtService jwtService;

    public StompAuthChannelInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            log.debug("WebSocket CONNECT authentication started");
            
            String userId = authenticateUser(accessor);
            if (userId != null) {
                accessor.setUser(new SimplePrincipal(userId));
                log.info("WebSocket authentication succeeded, userId: {}", userId);
                return message;
            }
            
            log.warn("WebSocket authentication failed, rejecting connection");
            throw new IllegalArgumentException("WebSocket authentication failed: no valid credentials provided");
        }
        
        return message;
    }

    /**
     * 企业级认证策略：尝试多种认证方式
     * @param accessor STOMP头部访问器
     * @return 认证成功的用户ID，失败返回null
     */
    private String authenticateUser(StompHeaderAccessor accessor) {
        
        // 方式1：优先从Spring Security上下文获取（HTTP升级的情况）
        String userId = authenticateFromSecurityContext();
        if (userId != null) {
            log.debug("Authenticated via Spring Security context");
            return userId;
        }
        
        // 方式2：从Authorization header解析JWT（主要方式）
        userId = authenticateFromJwtToken(accessor);
        if (userId != null) {
            log.debug("Authenticated via JWT token");
            return userId;
        }
        
        // 方式3：兜底从uid header获取（仅用于开发/测试环境）
        userId = authenticateFromUidHeader(accessor);
        if (userId != null) {
            log.debug("Authenticated via UID header (development mode)");
            return userId;
        }
        
        return null;
    }

    /**
     * 从Spring Security上下文获取用户ID
     */
    private String authenticateFromSecurityContext() {
        try {
            UUID uid = CurrentUser.idRequired();
            return uid.toString();
        } catch (Exception e) {
            log.debug("No user found in Spring Security context: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 从JWT Token认证用户
     */
    private String authenticateFromJwtToken(StompHeaderAccessor accessor) {
        List<String> authHeaders = accessor.getNativeHeader("Authorization");
        if (authHeaders == null || authHeaders.isEmpty()) {
            log.debug("Missing Authorization header");
            return null;
        }

        String authHeader = authHeaders.get(0);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.debug("Authorization header has invalid format: {}", authHeader);
            return null;
        }

        String token = authHeader.substring(7).trim();
        if (token.isEmpty()) {
            log.debug("JWT token is empty");
            return null;
        }

        try {
            // 使用JwtService的parse方法验证token并提取用户ID
            // parse方法会自动验证签名和过期时间，如果无效会抛出异常
            UUID userId = jwtService.getUserId(token);
            
            if (userId == null) {
                log.debug("JWT token does not contain a userId");
                return null;
            }

            return userId.toString();

        } catch (Exception e) {
            log.debug("Failed to parse JWT token: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 从UID header获取用户ID（仅用于开发/测试环境）
     */
    private String authenticateFromUidHeader(StompHeaderAccessor accessor) {
        List<String> uids = accessor.getNativeHeader("uid");
        if (uids == null || uids.isEmpty()) {
            log.debug("Missing uid header");
            return null;
        }

        String uid = uids.get(0);
        if (uid == null || uid.trim().isEmpty()) {
            log.debug("uid header is empty");
            return null;
        }

        try {
            // 验证UUID格式
            UUID.fromString(uid);
            log.warn("Authenticating via uid header (development only): {}", uid);
            return uid;
        } catch (IllegalArgumentException e) {
            log.debug("Invalid uid header format: {}", uid);
            return null;
        }
    }

    /**
     * 简单Principal实现
     */
    static class SimplePrincipal implements Principal {
        private final String name;
        
        SimplePrincipal(String name) { 
            this.name = name; 
        }
        
        @Override 
        public String getName() { 
            return name; 
        }
        
        @Override
        public String toString() {
            return "SimplePrincipal{name='" + name + "'}";
        }
    }
}
