// backend/user-service/src/main/java/com/koalaswap/user/dto/LoginReq.java
package com.koalaswap.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * 登录接口的请求体。
 */
public record LoginReq(
        @Email @NotBlank String email,   // 登录邮箱
        @NotBlank String password        // 明文密码（用于校验）
) {}
