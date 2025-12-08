package com.koalaswap.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 更新“我的资料”请求体。
 * 头像修改暂不在本次接口内。
 */
public record UpdateMyProfileReq(
        @NotBlank(message = "Display name must not be empty.")
        @Size(max = 50, message = "Display name must not exceed 50 characters.")
        String displayName,

        @Size(max = 200, message = "Bio must not exceed 200 characters.")
        String bio,

        @Size(max = 100, message = "Location must not exceed 100 characters.")
        String location
) {}

