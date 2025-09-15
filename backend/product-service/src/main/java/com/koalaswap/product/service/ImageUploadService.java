// ===============================
// backend/product-service/src/main/java/com/koalaswap/product/service/ImageUploadService.java
// 图片上传服务｜S3 预签名 URL + 状态管理
// ===============================
package com.koalaswap.product.service;

import com.koalaswap.product.config.S3Properties;
import com.koalaswap.product.dto.ImageUploadCompleteRequest;
import com.koalaswap.product.dto.ImageUploadRequest;
import com.koalaswap.product.dto.ImageUploadResponse;
import com.koalaswap.product.entity.ProductImage;
import com.koalaswap.product.repository.ProductImageRepository;
import com.koalaswap.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class ImageUploadService {

    private final S3Properties s3Properties;
    private final S3Client s3Client;
    private final ProductImageRepository imageRepository;
    private final ProductRepository productRepository;

    /**
     * 请求图片上传：生成预签名 URL
     */
    @Transactional
    public ImageUploadResponse requestUpload(ImageUploadRequest request, UUID currentUserId) {
        log.info("用户 {} 请求上传图片到商品 {}: {}", currentUserId, request.getProductId(), request.getFileName());

        // 1. 验证商品存在且用户有权限
        validateProduct(request.getProductId(), currentUserId);

        // 2. 验证文件
        validateFile(request);

        // 3. 检查商品图片数量限制
        checkImageLimit(request.getProductId());

        // 4. 生成 S3 对象键
        String objectKey = generateObjectKey(request.getProductId(), request.getFileName());

        // 5. 生成预签名 URL
        String uploadUrl = generatePresignedUrl(objectKey, request.getMimeType());

        // 6. 计算显示顺序
        int displayOrder = calculateDisplayOrder(request);

        // 7. 创建数据库记录（状态：UPLOADING）
        ProductImage image = new ProductImage(
            request.getProductId(),
            objectKey,
            request.getFileName(),
            request.getFileSize(),
            request.getMimeType(),
            currentUserId
        );
        image.setDisplayOrder(displayOrder);
        image.setIsPrimary(request.getIsPrimary() != null ? request.getIsPrimary() : false);

        // 如果设为主图，取消其他主图
        if (Boolean.TRUE.equals(image.getIsPrimary())) {
            clearOtherPrimaryImages(request.getProductId());
        }

        image = imageRepository.save(image);

        // 8. 返回响应
        long expiresAt = Instant.now().plus(Duration.ofMinutes(s3Properties.getPresignedUrlExpirationMinutes())).toEpochMilli();

        return new ImageUploadResponse(
            image.getId(),
            uploadUrl,
            objectKey,
            expiresAt,
            image.getIsPrimary(),
            image.getDisplayOrder()
        );
    }

    /**
     * 上传完成通知：更新状态
     */
    @Transactional
    public void completeUpload(ImageUploadCompleteRequest request, UUID currentUserId) {
        log.info("用户 {} 通知图片上传完成: {} - {}", currentUserId, request.getImageId(), request.getSuccess());

        ProductImage image = imageRepository.findById(request.getImageId())
            .orElseThrow(() -> new RuntimeException("图片记录不存在"));

        // 验证权限
        if (!image.getUploadedBy().equals(currentUserId)) {
            throw new RuntimeException("无权限操作此图片");
        }

        if (Boolean.TRUE.equals(request.getSuccess())) {
            // 上传成功
            String cdnUrl = s3Properties.buildCdnUrl(image.getObjectKey());
            image.markAsCompleted(cdnUrl);
        } else {
            // 上传失败
            image.markAsFailed();
            log.warn("图片上传失败: {} - {}", request.getImageId(), request.getErrorMessage());
        }

        imageRepository.save(image);
    }

    /**
     * 删除图片
     */
    @Transactional
    public void deleteImage(UUID imageId, UUID currentUserId) {
        ProductImage image = imageRepository.findById(imageId)
            .orElseThrow(() -> new RuntimeException("图片记录不存在"));

        // 验证权限（图片上传者或商品所有者）
        if (!image.getUploadedBy().equals(currentUserId)) {
            // TODO: 检查是否为商品所有者
            throw new RuntimeException("无权限删除此图片");
        }

        // 如果删除的是主图，自动设置下一张为主图
        boolean wasPrimary = Boolean.TRUE.equals(image.getIsPrimary());
        imageRepository.delete(image);

        if (wasPrimary) {
            setNextImageAsPrimary(image.getProductId());
        }

        log.info("用户 {} 删除图片: {}", currentUserId, imageId);
    }

    // === 私有辅助方法 ===

    private void validateProduct(UUID productId, UUID currentUserId) {
        boolean exists = productRepository.existsById(productId);
        if (!exists) {
            throw new RuntimeException("商品不存在");
        }
        // TODO: 验证用户是否为商品所有者
    }

    private void validateFile(ImageUploadRequest request) {
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

    private void checkImageLimit(UUID productId) {
        long currentCount = imageRepository.countByProductIdAndUploadStatus(productId, "COMPLETED");
        if (currentCount >= s3Properties.getUpload().getMaxImagesPerProduct()) {
            throw new RuntimeException("商品图片数量已达上限 " + s3Properties.getUpload().getMaxImagesPerProduct() + " 张");
        }
    }

    private String generateObjectKey(UUID productId, String fileName) {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String safeFileName = fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
        return String.format("product/%s/%s-%s", productId, timestamp, safeFileName);
    }

    private String generatePresignedUrl(String objectKey, String mimeType) {
        try {
            // 使用 S3Client 内置的预签名功能
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(s3Properties.getBucketName())
                .key(objectKey)
                .contentType(mimeType)
                .build();

            // 创建独立的 S3Presigner 实例
            try (S3Presigner presigner = S3Presigner.builder()
                    .region(software.amazon.awssdk.regions.Region.of(s3Properties.getRegion()))
                    .credentialsProvider(software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider.create())
                    .build()) {

                PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(s3Properties.getPresignedUrlExpirationMinutes()))
                    .putObjectRequest(putObjectRequest)
                    .build();

                PresignedPutObjectRequest presignedRequest = presigner.presignPutObject(presignRequest);
                return presignedRequest.url().toString();
            }

        } catch (Exception e) {
            log.error("生成预签名 URL 失败: {}", objectKey, e);
            throw new RuntimeException("生成上传链接失败");
        }
    }

    private int calculateDisplayOrder(ImageUploadRequest request) {
        if (request.getDisplayOrder() != null) {
            return request.getDisplayOrder();
        }

        // 自动分配：取当前最大值 + 1
        Integer maxOrder = imageRepository.findMaxDisplayOrderByProductId(request.getProductId());
        return (maxOrder != null ? maxOrder : -1) + 1;
    }

    private void clearOtherPrimaryImages(UUID productId) {
        List<ProductImage> primaryImages = imageRepository.findByProductIdAndIsPrimary(productId, true);
        for (ProductImage img : primaryImages) {
            img.setIsPrimary(false);
            imageRepository.save(img);
        }
    }

    private void setNextImageAsPrimary(UUID productId) {
        List<ProductImage> images = imageRepository.findByProductIdAndUploadStatusOrderByDisplayOrder(productId, "COMPLETED");
        if (!images.isEmpty()) {
            ProductImage nextPrimary = images.get(0);
            nextPrimary.setIsPrimary(true);
            imageRepository.save(nextPrimary);
        }
    }
}