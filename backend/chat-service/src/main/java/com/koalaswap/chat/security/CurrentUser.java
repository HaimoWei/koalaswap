// src/main/java/com/koalaswap/chat/security/CurrentUser.java
package com.koalaswap.chat.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Map;
import java.util.UUID;

public final class CurrentUser {
    private CurrentUser(){}

    /** 从 SecurityContext 的 principal 中提取 uid/userId/sub；失败抛 UNAUTHORIZED */
    public static UUID idRequired() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) throw new IllegalStateException("UNAUTHORIZED: no auth");
        Object p = auth.getPrincipal();

        // Map 型（common 的 JwtAuthFilter 通常是这种）
        if (p instanceof Map<?,?> map) {
            Object v = map.get("uid");
            if (v == null) v = map.get("userId");
            if (v == null) v = map.get("sub");     // ★ 顺序取，避免 getOrDefault 的泛型陷阱
            if (v != null) {
                try { return UUID.fromString(String.valueOf(v)); } catch (Exception ignored) {}
            }
        }
        // String 型（某些链路会把 sub 放到 principal 的字符串里）
        if (p instanceof String s) {
            try { return UUID.fromString(s); } catch (Exception ignored) {}
        }
        throw new IllegalStateException("UNAUTHORIZED: no uid claim");
    }
}
