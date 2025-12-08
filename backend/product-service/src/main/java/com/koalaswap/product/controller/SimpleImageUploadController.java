// ===============================
// 独立图片上传控制器（大厂标准做法）
// ===============================
package com.koalaswap.product.controller;

import com.koalaswap.product.dto.SimpleImageUploadRequest;
import com.koalaswap.product.dto.SimpleImageUploadResponse;
import com.koalaswap.product.client.FileServiceClient;
import com.koalaswap.common.security.SecuritySupport;
import org.springframework.security.core.Authentication;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
@Slf4j
public class SimpleImageUploadController {

    private final FileServiceClient fileServiceClient;

    /**
     * 独立图片上传：获取预签名URL（不依赖商品ID）
     * 现在代理到 file-service
     */
    @PostMapping("/upload-url")
    public ResponseEntity<SimpleImageUploadResponse> getUploadUrl(
        @Valid @RequestBody SimpleImageUploadRequest request,
        Authentication auth,
        HttpServletRequest httpRequest
    ) {
        UUID currentUserId = SecuritySupport.requireUserId(auth);
        String jwtToken = extractJwtToken(httpRequest);

        log.info("User {} requests image upload URL via product-service proxy", currentUserId);

        SimpleImageUploadResponse response = fileServiceClient.getImageUploadUrl(request, jwtToken);
        return ResponseEntity.ok(response);
    }

    /**
     * 批量获取图片上传URL
     * 现在代理到 file-service
     */
    @PostMapping("/batch-upload-urls")
    public ResponseEntity<List<SimpleImageUploadResponse>> getBatchUploadUrls(
        @Valid @RequestBody List<SimpleImageUploadRequest> requests,
        Authentication auth,
        HttpServletRequest httpRequest
    ) {
        UUID currentUserId = SecuritySupport.requireUserId(auth);
        String jwtToken = extractJwtToken(httpRequest);

        if (requests.size() > 8) {
            throw new RuntimeException("You can upload at most 8 images in a single request.");
        }

        log.info("User {} requests batch image upload URLs via product-service proxy", currentUserId);

        List<SimpleImageUploadResponse> responses = fileServiceClient.getBatchImageUploadUrls(requests, jwtToken);
        return ResponseEntity.ok(responses);
    }

    /**
     * 从请求中提取JWT Token
     */
    private String extractJwtToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader;
        }
        return null;
    }
}
