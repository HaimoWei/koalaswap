// ===============================
// 简单图片上传请求 DTO（不依赖商品ID）
// ===============================
package com.koalaswap.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SimpleImageUploadRequest {

    @NotBlank(message = "File name must not be empty.")
    @Size(max = 255, message = "File name must not exceed 255 characters.")
    private String fileName;

    @NotNull(message = "File size must not be empty.")
    private Long fileSize;

    @NotBlank(message = "File type must not be empty.")
    private String mimeType;
}
