// ===============================
// backend/product-service/src/main/java/com/koalaswap/product/dto/ImageUploadResponse.java
// 图片上传响应 DTO
// ===============================
package com.koalaswap.product.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImageUploadResponse {

    /** 图片记录ID */
    private UUID imageId;

    /** S3 预签名上传 URL */
    private String uploadUrl;

    /** S3 对象键 */
    private String objectKey;

    /** 上传过期时间（时间戳） */
    private long expiresAt;

    /** 是否为主图 */
    private Boolean isPrimary;

    /** 显示顺序 */
    private Integer displayOrder;
}