package com.koalaswap.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** 登录返回：前端拿 token 存本地，profile 用来展示头像昵称等 */
@Data @NoArgsConstructor @AllArgsConstructor
public class LoginRes {
    private String accessToken;
    private MyProfileRes profile;
}
