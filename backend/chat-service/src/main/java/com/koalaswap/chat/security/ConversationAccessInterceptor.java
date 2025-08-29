// src/main/java/com/koalaswap/chat/security/ConversationAccessInterceptor.java
package com.koalaswap.chat.security;

import com.koalaswap.chat.repository.ConversationParticipantRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class ConversationAccessInterceptor implements HandlerInterceptor, WebMvcConfigurer {

    private final ConversationParticipantRepository partRepo;
    private static final Pattern P = Pattern.compile("^/api/chat/conversations/([0-9a-fA-F\\-]{36})(/.*)?$");

    public ConversationAccessInterceptor(ConversationParticipantRepository partRepo) {
        this.partRepo = partRepo;
    }

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) {
        String path = req.getRequestURI();
        if (!path.startsWith("/api/chat/conversations")) return true;
        if ("POST".equalsIgnoreCase(req.getMethod()) && "/api/chat/conversations".equals(path)) return true; // 创建会话不校验

        Matcher m = P.matcher(path);
        if (!m.matches()) return true; // 列表等不校验

        final UUID uid;
        try {
            uid = CurrentUser.idRequired();
        } catch (IllegalStateException unauth) {
            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401
            return false;
        }

        UUID convId = UUID.fromString(m.group(1));
        boolean present = partRepo.findByConversationIdAndUserId(convId, uid).isPresent();
        if (!present) {
            res.setStatus(HttpServletResponse.SC_FORBIDDEN); // 403
            return false;
        }
        return true;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(this).addPathPatterns("/api/chat/**");
    }
}
