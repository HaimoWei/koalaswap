// backend/product-service/src/main/java/com/koalaswap/product/controller/ProductDebugController.java
package com.koalaswap.product.controller;

import com.koalaswap.common.dto.ApiResponse;
import com.koalaswap.common.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/products/debug")
@RequiredArgsConstructor
public class ProductDebugController {

    private final Environment env;
    private final JwtService jwtService;

    @GetMapping("/config")
    public ApiResponse<Map<String, Object>> config() {
        String secret = env.getProperty("app.jwt.secret");
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("secretLen", secret == null ? 0 : secret.length());
        m.put("hasSecret", secret != null && !secret.isBlank());
        return ApiResponse.ok(m);
    }

    @GetMapping("/parse")
    public ApiResponse<Map<String, Object>> parse(
            @RequestHeader(value = "Authorization", required = false) String auth) {

        if (auth == null || !auth.startsWith("Bearer ")) {
            return ApiResponse.error("no Bearer token");
        }
        String token = auth.substring(7).trim(); // 注意：这里必须是 substring(7)

        try {
            var jws = jwtService.parse(token);
            var c = jws.getBody();
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("sub", c.getSubject());
            m.put("uid", c.get("uid", String.class));
            m.put("email", c.get("email", String.class));
            m.put("iat", c.getIssuedAt());
            m.put("exp", c.getExpiration());
            return ApiResponse.ok(m);
        } catch (Exception e) {
            return ApiResponse.error(e.getClass().getSimpleName() + ": " + e.getMessage());
        }
    }
}
