package com.koalaswap.file.controller;

import com.koalaswap.common.dto.ApiResponse;
import com.koalaswap.common.security.SecuritySupport;
import com.koalaswap.file.dto.FileUploadRequest;
import com.koalaswap.file.dto.FileUploadResponse;
import com.koalaswap.file.service.FileUploadService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * 统一文件控制器
 * 提供文件上传相关的API接口
 */
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Slf4j
public class FileController {

    private final FileUploadService fileUploadService;

    /**
     * 获取单个文件上传URL
     *
     * @param request 上传请求
     * @param auth    认证信息
     * @return 上传响应
     */
    @PostMapping("/upload-url")
    public ResponseEntity<ApiResponse<FileUploadResponse>> getUploadUrl(
        @Valid @RequestBody FileUploadRequest request,
        Authentication auth
    ) {
        UUID userId = SecuritySupport.requireUserId(auth);
        log.info("User {} requests file upload URL: {}", userId, request.getFileName());

        FileUploadResponse response = fileUploadService.generateUploadUrl(request, userId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * 批量获取文件上传URL
     *
     * @param requests 上传请求列表
     * @param auth     认证信息
     * @return 上传响应列表
     */
    @PostMapping("/batch-upload-urls")
    public ResponseEntity<ApiResponse<List<FileUploadResponse>>> getBatchUploadUrls(
        @Valid @RequestBody List<FileUploadRequest> requests,
        Authentication auth
    ) {
        UUID userId = SecuritySupport.requireUserId(auth);
        log.info("User {} requests batch upload URLs for {} files", userId, requests.size());

        if (requests.size() > 10) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("You can upload at most 10 files in a single request."));
        }

        List<FileUploadResponse> responses = fileUploadService.generateBatchUploadUrls(requests, userId);
        return ResponseEntity.ok(ApiResponse.ok(responses));
    }

    /**
     * 根据分类获取文件上传URL（快捷方式）
     *
     * @param category 文件分类
     * @param request  上传请求（不包含category）
     * @param auth     认证信息
     * @return 上传响应
     */
    @PostMapping("/{category}/upload-url")
    public ResponseEntity<ApiResponse<FileUploadResponse>> getUploadUrlByCategory(
        @PathVariable String category,
        @Valid @RequestBody FileUploadRequest request,
        Authentication auth
    ) {
        UUID userId = SecuritySupport.requireUserId(auth);

        // 设置分类
        request.setCategory(category);

        log.info("User {} requests file upload URL for category {}: {}", userId, category, request.getFileName());

        FileUploadResponse response = fileUploadService.generateUploadUrl(request, userId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * 健康检查接口
     */
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.ok("File Service is running"));
    }
}
