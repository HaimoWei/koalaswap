package com.koalaswap.file.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 文件上传响应 DTO
 * 包含上传URL和访问信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileUploadResponse {

    /** 上传URL（预签名） */
    private String uploadUrl;

    /** S3对象键 */
    private String objectKey;

    /** CDN访问URL */
    private String cdnUrl;

    /** 过期时间戳 */
    private long expiresAt;

    /** 文件分类 */
    private String category;

    /** 文件类型 */
    private String fileType; // image, document, video, audio

    /** 文件大小限制 */
    private long maxFileSize;
}