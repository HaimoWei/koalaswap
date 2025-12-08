// src/main/java/com/koalaswap/user/controller/UserController.java
// backend/user-service/src/main/java/com/koalaswap/user/controller/UserController.java
package com.koalaswap.user.controller;

import com.koalaswap.common.dto.ApiResponse;
import com.koalaswap.common.security.SecuritySupport;
import com.koalaswap.user.dto.ChangePasswordReq;
import com.koalaswap.user.dto.UpdateMyProfileReq;
import com.koalaswap.user.dto.UpdateAvatarReq;
import com.koalaswap.user.dto.MyProfileRes;
import com.koalaswap.user.dto.PublicProfileRes;
import com.koalaswap.user.dto.UserBriefRes;
import com.koalaswap.user.entity.User;
import com.koalaswap.user.repository.UserRepository;
import com.koalaswap.user.service.AuthService;
import com.koalaswap.user.client.FileServiceClient;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;
    private final AuthService authService;
    private final FileServiceClient fileServiceClient;
    @Value("${app.user.default-avatar-url:/assets/avatars/default-avatar.svg}")
    private String defaultAvatarUrl;

    /** 我的资料（需登录） */
    @GetMapping("/me")
    public ApiResponse<MyProfileRes> me(Authentication auth) {
        var userId = SecuritySupport.requireUserId(auth);
        var u = userRepository.findById(userId).orElseThrow();
        var profile = new MyProfileRes(
                u.getId(), u.getEmail(), u.getDisplayName(),
                (u.getAvatarUrl()==null || u.getAvatarUrl().isBlank()) ? defaultAvatarUrl : u.getAvatarUrl(), u.getBio(), u.getLocation(),
                u.isPhoneVerified(), u.isEmailVerified(),
                (u.getRatingAvg()==null?0d:u.getRatingAvg().doubleValue()),
                u.getRatingCount(), u.getMemberSince(),
                u.getLastActiveAt(), u.getCreatedAt()
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
                .map(u -> new UserBriefRes(u.getId(), u.getDisplayName(),
                        (u.getAvatarUrl()==null || u.getAvatarUrl().isBlank()) ? defaultAvatarUrl : u.getAvatarUrl()))
                .toList();
        return ApiResponse.ok(res);
    }

    /** 单个用户简介（匿名开放） */
    @GetMapping("/{id}/brief")
    public ApiResponse<UserBriefRes> briefOne(@PathVariable UUID id) {
        var u = userRepository.findById(id).orElseThrow();
        return ApiResponse.ok(new UserBriefRes(u.getId(), u.getDisplayName(),
                (u.getAvatarUrl()==null || u.getAvatarUrl().isBlank()) ? defaultAvatarUrl : u.getAvatarUrl()));
    }

    /** 用户公共资料（匿名开放） */
    @GetMapping("/{id}/public")
    public ApiResponse<PublicProfileRes> publicProfile(@PathVariable UUID id) {
        var u = userRepository.findById(id).orElseThrow();
        var profile = new PublicProfileRes(
                u.getId(),
                u.getDisplayName(),
                (u.getAvatarUrl()==null || u.getAvatarUrl().isBlank()) ? defaultAvatarUrl : u.getAvatarUrl(),
                u.getBio(),
                u.getLocation(),
                u.isPhoneVerified(),
                u.isEmailVerified(),
                u.getRatingAvg() == null ? 0.0 : u.getRatingAvg().doubleValue(),
                u.getRatingCount(),
                u.getMemberSince(),
                u.getLastActiveAt(),
                u.getCreatedAt()
        );
        return ApiResponse.ok(profile);
    }

    /** 修改密码（需登录） */
    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordReq req, Authentication auth) {
        var userId = SecuritySupport.requireUserId(auth);
        authService.changePassword(userId, req.currentPassword(), req.newPassword());
        return ApiResponse.ok(null);
    }

    /** 更新我的资料（昵称/简介/地区）（需登录） */
    @PutMapping("/me")
    public ApiResponse<MyProfileRes> updateMe(@Valid @RequestBody UpdateMyProfileReq req, Authentication auth) {
        var userId = SecuritySupport.requireUserId(auth);
        var u = userRepository.findById(userId).orElseThrow();

        // 基础清洗：去首尾空格；可选字段空串按 null 处理
        u.setDisplayName(req.displayName().trim());
        u.setBio(normalize(req.bio()));
        u.setLocation(normalize(req.location()));

        userRepository.save(u);

        var profile = new MyProfileRes(
                u.getId(), u.getEmail(), u.getDisplayName(),
                (u.getAvatarUrl()==null || u.getAvatarUrl().isBlank()) ? defaultAvatarUrl : u.getAvatarUrl(), u.getBio(), u.getLocation(),
                u.isPhoneVerified(), u.isEmailVerified(),
                (u.getRatingAvg()==null?0d:u.getRatingAvg().doubleValue()),
                u.getRatingCount(), u.getMemberSince(),
                u.getLastActiveAt(), u.getCreatedAt()
        );
        return ApiResponse.ok(profile);
    }

    /** 获取头像上传URL（需登录） */
    @PostMapping("/me/avatar/upload-url")
    public ApiResponse<Map<String, Object>> getAvatarUploadUrl(
            @RequestBody Map<String, Object> request,
            Authentication auth,
            HttpServletRequest httpRequest) {

        // 从请求中提取参数
        String fileName = (String) request.get("fileName");
        Number fileSize = (Number) request.get("fileSize");
        String mimeType = (String) request.get("mimeType");

        if (fileName == null || fileSize == null || mimeType == null) {
            throw new RuntimeException("fileName, fileSize, and mimeType are required parameters.");
        }

        // 获取JWT token（从当前请求的Authorization header中）
        String authHeader = httpRequest.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Missing or invalid Authorization header.");
        }
        String jwtToken = authHeader.substring(7); // 移除 "Bearer " 前缀

        // 调用file-service获取上传URL
        Map<String, Object> response = fileServiceClient.getAvatarUploadUrl(
            fileName, fileSize.longValue(), mimeType, jwtToken
        );

        return ApiResponse.ok(response);
    }

    /** 更新我的头像（需登录） */
    @PutMapping("/me/avatar")
    public ApiResponse<MyProfileRes> updateMyAvatar(@Valid @RequestBody UpdateAvatarReq req, Authentication auth) {
        var userId = SecuritySupport.requireUserId(auth);
        var u = userRepository.findById(userId).orElseThrow();

        // 更新头像URL
        u.setAvatarUrl(req.avatarUrl());
        userRepository.save(u);

        var profile = new MyProfileRes(
                u.getId(), u.getEmail(), u.getDisplayName(),
                (u.getAvatarUrl()==null || u.getAvatarUrl().isBlank()) ? defaultAvatarUrl : u.getAvatarUrl(), u.getBio(), u.getLocation(),
                u.isPhoneVerified(), u.isEmailVerified(),
                (u.getRatingAvg()==null?0d:u.getRatingAvg().doubleValue()),
                u.getRatingCount(), u.getMemberSince(),
                u.getLastActiveAt(), u.getCreatedAt()
        );
        return ApiResponse.ok(profile);
    }

    private static String normalize(String v) {
        if (v == null) return null;
        var s = v.trim();
        return s.isEmpty() ? null : s;
    }
}
