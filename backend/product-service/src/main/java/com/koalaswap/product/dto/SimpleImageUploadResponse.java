// ===============================
// 简单图片上传响应 DTO
// ===============================
package com.koalaswap.product.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SimpleImageUploadResponse {

    /** 上传URL（预签名） */
    private String uploadUrl;

    /** S3对象键 */
    private String objectKey;

    /** CDN访问URL */
    private String cdnUrl;

    /** 过期时间戳 */
    private long expiresAt;
}