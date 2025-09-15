// ===============================
// backend/product-service/src/main/java/com/koalaswap/product/config/S3Properties.java
// AWS S3 配置绑定｜app.aws.*
// ===============================
package com.koalaswap.product.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.aws")
@Getter
@Setter
public class S3Properties {

    /** AWS 区域 */
    private String region = "ap-southeast-2";

    /** S3 桶名 */
    private String bucketName = "koalaswap";

    /** CloudFront CDN 基础 URL */
    private String cdnBaseUrl = "https://img.koalaswap.au";

    /** 预签名 URL 过期时间（分钟） */
    private int presignedUrlExpirationMinutes = 15;

    /** 文件上传相关限制 */
    private Upload upload = new Upload();

    @Getter
    @Setter
    public static class Upload {
        /** 单个文件最大大小（字节，默认 10MB） */
        private long maxFileSize = 10 * 1024 * 1024;

        /** 每个商品最多图片数 */
        private int maxImagesPerProduct = 8;

        /** 允许的 MIME 类型 */
        private String[] allowedMimeTypes = {
            "image/jpeg",
            "image/png",
            "image/webp"
        };

        /** 允许的文件扩展名 */
        private String[] allowedExtensions = {
            ".jpg", ".jpeg", ".png", ".webp"
        };
    }

    /** 生成完整的 CDN URL */
    public String buildCdnUrl(String objectKey) {
        if (objectKey == null || objectKey.trim().isEmpty()) {
            return null;
        }
        return cdnBaseUrl + "/" + objectKey.replaceFirst("^/", "");
    }
}