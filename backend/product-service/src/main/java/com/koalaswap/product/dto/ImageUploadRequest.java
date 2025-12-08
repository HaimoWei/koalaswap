// ===============================
// backend/product-service/src/main/java/com/koalaswap/product/dto/ImageUploadRequest.java
// 图片上传请求 DTO
// ===============================
package com.koalaswap.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class ImageUploadRequest {

    @NotNull(message = "Item ID must not be empty.")
    private UUID productId;

    @NotBlank(message = "File name must not be empty.")
    @Size(max = 255, message = "File name must not exceed 255 characters.")
    private String fileName;

    @NotNull(message = "File size must not be empty.")
    private Long fileSize;

    @NotBlank(message = "File type must not be empty.")
    private String mimeType;

    /** 是否设为主图（可选，默认false） */
    private Boolean isPrimary = false;

    /** 显示顺序（可选，后端会自动分配） */
    private Integer displayOrder;
}
