package com.koalaswap.common.security;

import java.util.UUID;

/** 提供用户当前 token 版本号的接口（可由 HTTP/Redis 等实现） */
public interface TokenVersionProvider {
    int currentVersion(UUID userId);
}
