// src/main/java/com/koalaswap/user/controller/UserController.java
package com.koalaswap.user.controller;

import com.koalaswap.common.dto.ApiResponse;
import com.koalaswap.common.security.SecuritySupport;
import com.koalaswap.user.dto.MyProfileRes;
import com.koalaswap.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;

    @GetMapping("/me")
    public ApiResponse<MyProfileRes> me(Authentication auth) {
        var userId = SecuritySupport.requireUserId(auth);
        var u = userRepository.findById(userId).orElseThrow(); // 正常不会找不到
        // 你已有 AuthService.toMyProfile(u) 私有方法；这里简单复制或抽到 Mapper
        var profile = new MyProfileRes(
                u.getId(), u.getEmail(), u.getDisplayName(),
                u.getAvatarUrl(), u.getBio(), u.isEmailVerified(),
                (u.getRatingAvg()==null?0d:u.getRatingAvg().doubleValue()),
                u.getRatingCount(), u.getCreatedAt()
        );
        return ApiResponse.ok(profile);
    }
}
