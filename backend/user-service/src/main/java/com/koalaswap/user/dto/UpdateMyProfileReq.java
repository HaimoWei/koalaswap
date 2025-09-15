package com.koalaswap.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 更新“我的资料”请求体。
 * 头像修改暂不在本次接口内。
 */
public record UpdateMyProfileReq(
        @NotBlank(message = "昵称不能为空")
        @Size(max = 50, message = "昵称不能超过50个字符")
        String displayName,

        @Size(max = 200, message = "个人简介不能超过200个字符")
        String bio,

        @Size(max = 100, message = "所在地区不能超过100个字符")
        String location
) {}

