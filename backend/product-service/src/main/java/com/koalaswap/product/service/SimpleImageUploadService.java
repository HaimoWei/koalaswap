// ===============================
// 独立图片上传服务（大厂标准做法）
// ===============================
package com.koalaswap.product.service;

import com.koalaswap.product.config.S3Properties;
import com.koalaswap.product.dto.SimpleImageUploadRequest;
import com.koalaswap.product.dto.SimpleImageUploadResponse;
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
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class SimpleImageUploadService {

    private final S3Properties s3Properties;
    private final S3Presigner s3Presigner;

    /**
     * 生成图片上传URL（独立于商品，直接上传到云存储）
     */
    public SimpleImageUploadResponse generateUploadUrl(SimpleImageUploadRequest request, UUID currentUserId) {
        log.info("用户 {} 请求上传图片: {}", currentUserId, request.getFileName());

        // 1. 验证文件
        validateFile(request);

        // 2. 生成独立的S3对象键（按用户和时间组织）
        String objectKey = generateIndependentObjectKey(currentUserId, request.getFileName());

        // 3. 生成预签名上传URL
        String uploadUrl = generatePresignedUrl(objectKey, request.getMimeType());

        // 4. 生成CDN访问URL
        String cdnUrl = s3Properties.buildCdnUrl(objectKey);

        // 5. 过期时间
        long expiresAt = Instant.now().plus(Duration.ofMinutes(s3Properties.getPresignedUrlExpirationMinutes())).toEpochMilli();

        log.info("生成图片上传URL成功: {}", objectKey);

        return new SimpleImageUploadResponse(uploadUrl, objectKey, cdnUrl, expiresAt);
    }

    /**
     * 验证文件格式和大小
     */
    private void validateFile(SimpleImageUploadRequest request) {
        // 验证文件大小
        if (request.getFileSize() > s3Properties.getUpload().getMaxFileSize()) {
            throw new RuntimeException("文件过大，最大允许 " + (s3Properties.getUpload().getMaxFileSize() / 1024 / 1024) + "MB");
        }

        // 验证 MIME 类型
        String[] allowedTypes = s3Properties.getUpload().getAllowedMimeTypes();
        if (!Arrays.asList(allowedTypes).contains(request.getMimeType())) {
            throw new RuntimeException("不支持的文件类型: " + request.getMimeType());
        }

        // 验证文件扩展名
        String fileName = request.getFileName().toLowerCase();
        String[] allowedExts = s3Properties.getUpload().getAllowedExtensions();
        boolean validExt = Arrays.stream(allowedExts).anyMatch(fileName::endsWith);
        if (!validExt) {
            throw new RuntimeException("不支持的文件扩展名");
        }
    }

    /**
     * 生成独立的S3对象键（按用户和时间组织，便于管理）
     */
    private String generateIndependentObjectKey(UUID userId, String fileName) {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String randomId = UUID.randomUUID().toString().substring(0, 8);
        String safeFileName = fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
        return String.format("images/users/%s/%s-%s-%s", userId, timestamp, randomId, safeFileName);
    }

    /**
     * 生成预签名上传URL
     */
    private String generatePresignedUrl(String objectKey, String mimeType) {
        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(s3Properties.getBucketName())
                .key(objectKey)
                .contentType(mimeType)
                .build();

            PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(s3Properties.getPresignedUrlExpirationMinutes()))
                .putObjectRequest(putObjectRequest)
                .build();

            PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(presignRequest);
            return presignedRequest.url().toString();

        } catch (Exception e) {
            log.error("生成预签名URL失败: {}", e.getMessage(), e);
            throw new RuntimeException("生成上传URL失败: " + e.getMessage());
        }
    }
}