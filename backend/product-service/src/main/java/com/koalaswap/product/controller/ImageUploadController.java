// ===============================
// backend/product-service/src/main/java/com/koalaswap/product/controller/ImageUploadController.java
// 控制器｜商品图片上传 API
// ===============================
package com.koalaswap.product.controller;

import com.koalaswap.product.dto.ImageUploadCompleteRequest;
import com.koalaswap.product.dto.ImageUploadRequest;
import com.koalaswap.product.dto.ImageUploadResponse;
import com.koalaswap.product.entity.ProductImage;
import com.koalaswap.product.repository.ProductImageRepository;
import com.koalaswap.product.service.ImageUploadService;
import com.koalaswap.common.security.SecuritySupport;
import org.springframework.security.core.Authentication;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products/images")
@RequiredArgsConstructor
@Slf4j
public class ImageUploadController {

    private final ImageUploadService uploadService;
    private final ProductImageRepository imageRepository;

    /**
     * 请求图片上传：获取预签名 URL
     */
    @PostMapping("/request-upload")
    public ResponseEntity<ImageUploadResponse> requestUpload(@Valid @RequestBody ImageUploadRequest request, Authentication auth) {
        UUID currentUserId = SecuritySupport.requireUserId(auth);
        ImageUploadResponse response = uploadService.requestUpload(request, currentUserId);
        return ResponseEntity.ok(response);
    }

    /**
     * 通知上传完成
     */
    @PostMapping("/upload-complete")
    public ResponseEntity<Void> uploadComplete(@Valid @RequestBody ImageUploadCompleteRequest request, Authentication auth) {
        UUID currentUserId = SecuritySupport.requireUserId(auth);
        uploadService.completeUpload(request, currentUserId);
        return ResponseEntity.ok().build();
    }

    /**
     * 删除图片
     */
    @DeleteMapping("/{imageId}")
    public ResponseEntity<Void> deleteImage(@PathVariable UUID imageId, Authentication auth) {
        UUID currentUserId = SecuritySupport.requireUserId(auth);
        uploadService.deleteImage(imageId, currentUserId);
        return ResponseEntity.ok().build();
    }

    /**
     * 查询商品的所有图片
     */
    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ProductImage>> getProductImages(@PathVariable UUID productId) {
        List<ProductImage> images = imageRepository.findByProductIdAndUploadStatusOrderByDisplayOrder(productId, "COMPLETED");
        return ResponseEntity.ok(images);
    }

    /**
     * 查询商品的主图
     */
    @GetMapping("/product/{productId}/primary")
    public ResponseEntity<ProductImage> getPrimaryImage(@PathVariable UUID productId) {
        return imageRepository.findFirstByProductIdAndIsPrimary(productId, true)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 设置主图
     */
    @PutMapping("/{imageId}/set-primary")
    public ResponseEntity<Void> setPrimaryImage(@PathVariable UUID imageId, Authentication auth) {
        UUID currentUserId = SecuritySupport.requireUserId(auth);

        ProductImage image = imageRepository.findById(imageId)
            .orElseThrow(() -> new RuntimeException("图片不存在"));

        // 验证权限
        if (!image.getUploadedBy().equals(currentUserId)) {
            throw new RuntimeException("无权限操作此图片");
        }

        // 清除同商品的其他主图
        List<ProductImage> otherPrimaryImages = imageRepository.findByProductIdAndIsPrimary(image.getProductId(), true);
        for (ProductImage otherImage : otherPrimaryImages) {
            if (!otherImage.getId().equals(imageId)) {
                otherImage.setIsPrimary(false);
                imageRepository.save(otherImage);
            }
        }

        // 设置为主图
        image.setIsPrimary(true);
        imageRepository.save(image);

        return ResponseEntity.ok().build();
    }

    /**
     * 批量上传请求（一次请求多张图片的预签名 URL）
     */
    @PostMapping("/batch-request-upload")
    public ResponseEntity<List<ImageUploadResponse>> batchRequestUpload(
        @Valid @RequestBody List<ImageUploadRequest> requests,
        Authentication auth
    ) {
        UUID currentUserId = SecuritySupport.requireUserId(auth);

        if (requests.size() > 5) {
            throw new RuntimeException("单次最多上传 5 张图片");
        }

        List<ImageUploadResponse> responses = requests.stream()
            .map(request -> uploadService.requestUpload(request, currentUserId))
            .toList();

        return ResponseEntity.ok(responses);
    }

    /**
     * 更新图片顺序
     */
    @PutMapping("/{imageId}/order")
    public ResponseEntity<Void> updateImageOrder(
        @PathVariable UUID imageId,
        @RequestParam int displayOrder,
        Authentication auth
    ) {
        UUID currentUserId = SecuritySupport.requireUserId(auth);

        ProductImage image = imageRepository.findById(imageId)
            .orElseThrow(() -> new RuntimeException("图片不存在"));

        // 验证权限
        if (!image.getUploadedBy().equals(currentUserId)) {
            throw new RuntimeException("无权限操作此图片");
        }

        image.setDisplayOrder(displayOrder);
        imageRepository.save(image);

        return ResponseEntity.ok().build();
    }
}