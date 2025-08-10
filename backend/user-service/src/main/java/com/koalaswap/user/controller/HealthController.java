package com.koalaswap.user.controller;

import com.koalaswap.common.dto.ApiResponse;
import com.koalaswap.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 健康检查 / 快速联通性验证接口。
 * 生产环境你可以扩展更多健康指标（DB、缓存、版本号等）。
 */
@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthController {

    private final UserRepository userRepository;

    @GetMapping("/db")
    public ApiResponse<Long> db() {
        long count = userRepository.count(); // SELECT COUNT(*) FROM users
        return ApiResponse.ok(count);
    }
}
