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

    @NotNull(message = "商品ID不能为空")
    private UUID productId;

    @NotBlank(message = "文件名不能为空")
    @Size(max = 255, message = "文件名长度不能超过255字符")
    private String fileName;

    @NotNull(message = "文件大小不能为空")
    private Long fileSize;

    @NotBlank(message = "文件类型不能为空")
    private String mimeType;

    /** 是否设为主图（可选，默认false） */
    private Boolean isPrimary = false;

    /** 显示顺序（可选，后端会自动分配） */
    private Integer displayOrder;
}