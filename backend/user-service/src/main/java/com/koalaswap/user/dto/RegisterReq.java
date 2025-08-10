// backend/user-service/src/main/java/com/koalaswap/user/dto/RegisterReq.java
package com.koalaswap.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * 注册接口的请求体。
 * 使用 record：不可变数据载体，适合做 DTO。
 * @Email/@NotBlank 用于参数校验（配合 @Valid）。
 */
public record RegisterReq(
        @Email @NotBlank String email,       // 用户邮箱（必须是合法邮箱）
        @NotBlank String password,           // 明文密码（后端会加密后存储）
        @NotBlank String displayName         // 昵称（必填）
) {}
