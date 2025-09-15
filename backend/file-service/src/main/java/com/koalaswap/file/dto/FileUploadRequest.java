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

    @NotBlank(message = "文件名不能为空")
    @Size(max = 255, message = "文件名长度不能超过255字符")
    private String fileName;

    @NotNull(message = "文件大小不能为空")
    private Long fileSize;

    @NotBlank(message = "文件类型不能为空")
    private String mimeType;

    @NotBlank(message = "业务分类不能为空")
    private String category; // avatar, product, chat, document

    // 可选字段：业务相关的额外信息
    private String bizId;     // 业务ID（如productId、conversationId等）
    private String bizType;   // 业务类型的细分（如product_main、product_detail等）
}