package com.koalaswap.file.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 文件上传请求 DTO
 * 支持多种文件类型和业务场景
 */
@Data
public class FileUploadRequest {

    @NotBlank(message = "File name must not be empty.")
    @Size(max = 255, message = "File name must not exceed 255 characters.")
    private String fileName;

    @NotNull(message = "File size must not be empty.")
    private Long fileSize;

    @NotBlank(message = "File type must not be empty.")
    private String mimeType;

    @NotBlank(message = "File category must not be empty.")
    private String category; // avatar, product, chat, document

    // 可选字段：业务相关的额外信息
    private String bizId;     // 业务ID（如productId、conversationId等）
    private String bizType;   // 业务类型的细分（如product_main、product_detail等）
}
