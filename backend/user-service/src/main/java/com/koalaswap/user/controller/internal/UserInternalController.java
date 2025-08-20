package com.koalaswap.user.controller.internal;

import com.koalaswap.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import com.koalaswap.common.dto.ApiResponse;
import com.koalaswap.user.dto.UserBriefRes;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/internal/users")
@RequiredArgsConstructor
public class UserInternalController {
    private final UserRepository users;

    @GetMapping("/{id}/token-version")
    public Integer tokenVersion(@PathVariable UUID id) {
        return users.findTokenVersionById(id).orElse(1);
    }


    /**
     * 批量获取用户简介（头像、昵称）——匿名可访问
     * GET /api/internal/users/brief?ids={id}&ids={id2}...
     */
    @GetMapping("/brief")
    public ApiResponse<List<UserBriefRes>> briefBatch(@RequestParam(name = "ids", required = false) List<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return ApiResponse.ok(List.of());
        }
        var idList = ids.stream().filter(Objects::nonNull).distinct().toList();
        var found = users.findAllById(idList);
        var data = found.stream()
                .map(u -> new UserBriefRes(u.getId(), u.getDisplayName(), u.getAvatarUrl()))
                .collect(Collectors.toList());
        return ApiResponse.ok(data);
    }

    /**
     * 单个用户简介——匿名可访问
     * GET /api/internal/users/{id}/brief
     */
    @GetMapping("/{id}/brief")
    public ApiResponse<UserBriefRes> briefOne(@PathVariable UUID id) {
        var u = users.findById(id).orElseThrow();
        return ApiResponse.ok(new UserBriefRes(u.getId(), u.getDisplayName(), u.getAvatarUrl()));
    }
}
