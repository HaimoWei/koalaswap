// ===============================
// backend/product-service/src/main/java/com/koalaswap/product/dto/ImageUploadCompleteRequest.java
// 图片上传完成通知 DTO
// ===============================
package com.koalaswap.product.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class ImageUploadCompleteRequest {

    @NotNull(message = "Image ID must not be empty.")
    private UUID imageId;

    @NotNull(message = "Upload status must not be empty.")
    private Boolean success;

    /** 错误信息（上传失败时提供） */
    private String errorMessage;
}
