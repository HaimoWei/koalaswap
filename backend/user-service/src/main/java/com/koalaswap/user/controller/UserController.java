// src/main/java/com/koalaswap/user/controller/UserController.java
// backend/user-service/src/main/java/com/koalaswap/user/controller/UserController.java
package com.koalaswap.user.controller;

import com.koalaswap.common.dto.ApiResponse;
import com.koalaswap.common.security.SecuritySupport;
import com.koalaswap.user.dto.MyProfileRes;
import com.koalaswap.user.dto.UserBriefRes;
import com.koalaswap.user.entity.User;
import com.koalaswap.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;

    /** 我的资料（需登录） */
    @GetMapping("/me")
    public ApiResponse<MyProfileRes> me(Authentication auth) {
        var userId = SecuritySupport.requireUserId(auth);
        var u = userRepository.findById(userId).orElseThrow();
        var profile = new MyProfileRes(
                u.getId(), u.getEmail(), u.getDisplayName(),
                u.getAvatarUrl(), u.getBio(), u.isEmailVerified(),
                (u.getRatingAvg()==null?0d:u.getRatingAvg().doubleValue()),
                u.getRatingCount(), u.getCreatedAt()
        );
        return ApiResponse.ok(profile);
    }

    /** 批量用户简介（匿名开放）：?ids=id1,id2,id3 */
    @GetMapping("/brief")
    public ApiResponse<List<UserBriefRes>> briefs(@RequestParam String ids) {
        var idList = Arrays.stream(ids.split(","))
                .map(String::trim).filter(s -> !s.isEmpty())
                .map(UUID::fromString).toList();
        var users = userRepository.findAllById(idList);
        var res = users.stream()
                .map(u -> new UserBriefRes(u.getId(), u.getDisplayName(), u.getAvatarUrl()))
                .toList();
        return ApiResponse.ok(res);
    }

    /** 单个用户简介（匿名开放） */
    @GetMapping("/{id}/brief")
    public ApiResponse<UserBriefRes> briefOne(@PathVariable UUID id) {
        var u = userRepository.findById(id).orElseThrow();
        return ApiResponse.ok(new UserBriefRes(u.getId(), u.getDisplayName(), u.getAvatarUrl()));
    }
}
