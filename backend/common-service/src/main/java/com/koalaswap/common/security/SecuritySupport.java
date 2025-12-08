package com.koalaswap.common.security;

import org.springframework.security.core.Authentication;

import java.util.UUID;

/** 安全相关的便捷方法 */
public final class SecuritySupport {
    private SecuritySupport() {}

    /** 需要登录的接口：强制取 userId，取不到抛异常（交给全局异常处理 → 401） */
    public static UUID requireUserId(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new IllegalStateException("Not authenticated.");
        }
        try {
            return UUID.fromString(auth.getName());
        } catch (Exception e) {
            throw new IllegalStateException("Invalid user identity.");
        }
    }

    /** 匿名可访问：取不到返回 null（比如商品详情页可选登录） */
    public static UUID currentUserIdOrNull(Authentication auth) {
        if (auth == null || auth.getName() == null) return null;
        try {
            return UUID.fromString(auth.getName());
        } catch (Exception e) {
            return null;
        }
    }
}
