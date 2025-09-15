package com.koalaswap.file.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * 健康检查控制器
 * 提供服务状态检查接口
 */
@RestController
@RequestMapping("/health")
public class HealthController {

    @GetMapping
    public Map<String, Object> health() {
        return Map.of(
            "status", "UP",
            "service", "file-service",
            "timestamp", Instant.now().toString(),
            "version", "1.0.0"
        );
    }

    @GetMapping("/ping")
    public String ping() {
        return "pong";
    }
}