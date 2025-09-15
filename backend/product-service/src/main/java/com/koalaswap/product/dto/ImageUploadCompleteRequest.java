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

    @NotNull(message = "图片ID不能为空")
    private UUID imageId;

    @NotNull(message = "上传状态不能为空")
    private Boolean success;

    /** 错误信息（上传失败时提供） */
    private String errorMessage;
}