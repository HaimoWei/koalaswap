package com.koalaswap.file.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;

/**
 * 文件服务配置属性
 * 支持多种文件类型和业务场景的配置
 */
@Configuration
@ConfigurationProperties(prefix = "app.file")
@Getter
@Setter
public class FileProperties {

    /** AWS 区域 */
    private String region = "ap-southeast-2";

    /** S3 桶名 */
    private String bucketName = "koalaswap";

    /** CloudFront CDN 基础 URL */
    private String cdnBaseUrl = "https://img.koalaswap.au";

    /** 预签名 URL 过期时间（分钟） */
    private int presignedUrlExpirationMinutes = 15;

    /** 各种业务类型的文件配置 */
    private Map<String, CategoryConfig> categories = new HashMap<>();

    /**
     * 初始化默认配置
     */
    @PostConstruct
    public void init() {
        // 如果配置文件中没有配置，则使用默认值
        categories.putIfAbsent("avatar", CategoryConfig.builder()
            .maxFileSize(5 * 1024 * 1024)  // 5MB
            .pathPrefix("files/avatars")
            .allowedMimeTypes(new String[]{"image/jpeg", "image/png", "image/webp"})
            .allowedExtensions(new String[]{".jpg", ".jpeg", ".png", ".webp"})
            .enableCompress(true)
            .enableWatermark(false)
            .build());

        categories.putIfAbsent("product", CategoryConfig.builder()
            .maxFileSize(10 * 1024 * 1024) // 10MB
            .pathPrefix("files/products")
            .allowedMimeTypes(new String[]{"image/jpeg", "image/png", "image/webp"})
            .allowedExtensions(new String[]{".jpg", ".jpeg", ".png", ".webp"})
            .enableCompress(true)
            .enableWatermark(false)
            .build());

        categories.putIfAbsent("chat", CategoryConfig.builder()
            .maxFileSize(20 * 1024 * 1024) // 20MB
            .pathPrefix("files/chats")
            .allowedMimeTypes(new String[]{"image/jpeg", "image/png", "image/webp", "image/gif"})
            .allowedExtensions(new String[]{".jpg", ".jpeg", ".png", ".webp", ".gif"})
            .enableCompress(true)
            .enableWatermark(false)
            .build());

        categories.putIfAbsent("document", CategoryConfig.builder()
            .maxFileSize(50 * 1024 * 1024) // 50MB
            .pathPrefix("files/documents")
            .allowedMimeTypes(new String[]{"application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"})
            .allowedExtensions(new String[]{".pdf", ".doc", ".docx"})
            .enableCompress(false)
            .enableWatermark(false)
            .build());

        // 静态素材（例如站点默认头像、图标等），允许 SVG
        categories.putIfAbsent("assets", CategoryConfig.builder()
            .maxFileSize(5 * 1024 * 1024)  // 5MB 足够 SVG/PNG 默认头像
            .pathPrefix("assets")
            .allowedMimeTypes(new String[]{"image/svg+xml", "image/png", "image/webp", "image/jpeg"})
            .allowedExtensions(new String[]{".svg", ".png", ".webp", ".jpg", ".jpeg"})
            .enableCompress(false)
            .enableWatermark(false)
            .build());
    }

    /**
     * 根据分类获取配置
     */
    public CategoryConfig getCategoryConfig(String category) {
        CategoryConfig config = categories.get(category);
        if (config == null) {
            throw new IllegalArgumentException("Unsupported file category: " + category);
        }
        return config;
    }

    /**
     * 生成完整的 CDN URL
     */
    public String buildCdnUrl(String objectKey) {
        if (objectKey == null || objectKey.trim().isEmpty()) {
            return null;
        }
        return cdnBaseUrl + "/" + objectKey.replaceFirst("^/", "");
    }

    /**
     * 文件分类配置
     */
    @Getter
    @Setter
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class CategoryConfig {
        /** 单个文件最大大小（字节） */
        private long maxFileSize;

        /** 文件路径前缀 */
        private String pathPrefix;

        /** 允许的 MIME 类型 */
        private String[] allowedMimeTypes;

        /** 允许的文件扩展名 */
        private String[] allowedExtensions;

        /** 是否启用压缩 */
        @lombok.Builder.Default
        private boolean enableCompress = true;

        /** 是否启用水印 */
        @lombok.Builder.Default
        private boolean enableWatermark = false;
    }
}
