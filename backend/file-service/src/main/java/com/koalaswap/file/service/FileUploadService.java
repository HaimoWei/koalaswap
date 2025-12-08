package com.koalaswap.file.service;

import com.koalaswap.file.config.FileProperties;
import com.koalaswap.file.dto.FileUploadRequest;
import com.koalaswap.file.dto.FileUploadResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * 文件上传服务
 * 提供统一的文件上传功能，支持多种业务场景
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class FileUploadService {

    private final FileProperties fileProperties;
    private final S3Presigner s3Presigner;
    private final FilePathGenerator pathGenerator;

    /**
     * 生成文件上传URL
     *
     * @param request 上传请求
     * @param userId  用户ID
     * @return 上传响应，包含预签名URL和CDN地址
     */
    public FileUploadResponse generateUploadUrl(FileUploadRequest request, UUID userId) {
        log.info("User {} requests to upload file: {} (category: {}, size: {})",
            userId, request.getFileName(), request.getCategory(), request.getFileSize());

        // 1. 验证文件
        validateFile(request);

        // 2. 生成文件路径
        String objectKey = pathGenerator.generatePath(
            request.getCategory(), userId, request.getFileName(), request.getBizId());

        // 3. 生成预签名URL
        String uploadUrl = generatePresignedUrl(objectKey, request.getMimeType());

        // 4. 生成CDN URL
        String cdnUrl = fileProperties.buildCdnUrl(objectKey);

        // 5. 获取配置信息
        FileProperties.CategoryConfig config = fileProperties.getCategoryConfig(request.getCategory());

        // 6. 计算过期时间
        long expiresAt = Instant.now()
            .plus(Duration.ofMinutes(fileProperties.getPresignedUrlExpirationMinutes()))
            .toEpochMilli();

        log.info("Successfully generated file upload URL: {}", objectKey);

        return FileUploadResponse.builder()
            .uploadUrl(uploadUrl)
            .objectKey(objectKey)
            .cdnUrl(cdnUrl)
            .category(request.getCategory())
            .fileType(pathGenerator.detectFileType(request.getMimeType()))
            .maxFileSize(config.getMaxFileSize())
            .expiresAt(expiresAt)
            .build();
    }

    /**
     * 批量生成文件上传URL
     *
     * @param requests 上传请求列表
     * @param userId   用户ID
     * @return 上传响应列表
     */
    public List<FileUploadResponse> generateBatchUploadUrls(List<FileUploadRequest> requests, UUID userId) {
        log.info("User {} requests to batch upload {} files", userId, requests.size());

        // 限制批量上传数量
        if (requests.size() > 10) {
            throw new RuntimeException("You can upload at most 10 files in a single request.");
        }

        return requests.stream()
            .map(request -> generateUploadUrl(request, userId))
            .toList();
    }

    /**
     * 验证文件格式和大小
     */
    private void validateFile(FileUploadRequest request) {
        FileProperties.CategoryConfig config = fileProperties.getCategoryConfig(request.getCategory());

        // 验证文件大小
        if (request.getFileSize() > config.getMaxFileSize()) {
            throw new RuntimeException(String.format(
                "File size exceeds the maximum allowed of %d MB",
                config.getMaxFileSize() / 1024 / 1024
            ));
        }

        // 验证 MIME 类型
        String[] allowedTypes = config.getAllowedMimeTypes();
        if (allowedTypes != null && allowedTypes.length > 0) {
            boolean isValidMimeType = Arrays.stream(allowedTypes)
                .anyMatch(type -> {
                    if (type.endsWith("/*")) {
                        // 支持通配符，如 "image/*"
                        String prefix = type.substring(0, type.length() - 2);
                        return request.getMimeType().startsWith(prefix);
                    } else {
                        return type.equals(request.getMimeType());
                    }
                });

            if (!isValidMimeType) {
                throw new RuntimeException("Unsupported file type: " + request.getMimeType());
            }
        }

        // 验证文件扩展名
        String fileName = request.getFileName().toLowerCase();
        String[] allowedExts = config.getAllowedExtensions();
        if (allowedExts != null && allowedExts.length > 0) {
            boolean validExt = Arrays.stream(allowedExts)
                .anyMatch(fileName::endsWith);
            if (!validExt) {
                throw new RuntimeException("Unsupported file extension.");
            }
        }
    }

    /**
     * 生成预签名上传URL
     */
    private String generatePresignedUrl(String objectKey, String mimeType) {
        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(fileProperties.getBucketName())
                .key(objectKey)
                .contentType(mimeType)
                .build();

            PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(fileProperties.getPresignedUrlExpirationMinutes()))
                .putObjectRequest(putObjectRequest)
                .build();

            PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(presignRequest);
            return presignedRequest.url().toString();

        } catch (Exception e) {
            log.error("Failed to generate presigned URL: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate upload URL: " + e.getMessage());
        }
    }
}
