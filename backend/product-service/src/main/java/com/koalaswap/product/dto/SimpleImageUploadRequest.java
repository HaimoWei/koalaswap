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

    @NotBlank(message = "文件名不能为空")
    @Size(max = 255, message = "文件名长度不能超过255字符")
    private String fileName;

    @NotNull(message = "文件大小不能为空")
    private Long fileSize;

    @NotBlank(message = "文件类型不能为空")
    private String mimeType;
}