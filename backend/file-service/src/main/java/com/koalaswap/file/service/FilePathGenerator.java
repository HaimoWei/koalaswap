package com.koalaswap.file.service;

import com.koalaswap.file.config.FileProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * 文件路径生成器
 * 根据业务类型生成标准化的文件存储路径
 */
@Service
@RequiredArgsConstructor
public class FilePathGenerator {

    private final FileProperties fileProperties;

    /**
     * 生成文件存储路径
     *
     * @param category 文件分类（avatar, product, chat, document）
     * @param userId   用户ID
     * @param fileName 原始文件名
     * @param bizId    业务ID（可选）
     * @return 标准化的对象键
     */
    public String generatePath(String category, UUID userId, String fileName, String bizId) {
        FileProperties.CategoryConfig config = fileProperties.getCategoryConfig(category);
        String pathPrefix = config.getPathPrefix();

        String timestamp = String.valueOf(System.currentTimeMillis());
        String randomId = UUID.randomUUID().toString().substring(0, 8);
        String safeFileName = sanitizeFileName(fileName);

        // 根据不同业务类型生成不同的路径结构
        // 为了兼容现有S3 bucket policy，avatar和product都使用相同的路径结构
        return switch (category) {
            case "avatar", "product" -> String.format("%s/%s/%s-%s-%s",
                pathPrefix, userId, timestamp, randomId, safeFileName);

            case "chat" -> {
                if (bizId != null && !bizId.trim().isEmpty()) {
                    yield String.format("%s/%s/%s-%s-%s",
                        pathPrefix, bizId, timestamp, randomId, safeFileName);
                } else {
                    yield String.format("%s/%s/%s-%s-%s",
                        pathPrefix, userId, timestamp, randomId, safeFileName);
                }
            }

            case "document" -> String.format("%s/%s/%s/%s-%s-%s",
                pathPrefix, category, userId, timestamp, randomId, safeFileName);

            default -> String.format("%s/misc/%s/%s-%s-%s",
                pathPrefix, userId, timestamp, randomId, safeFileName);
        };
    }

    /**
     * 生成文件存储路径（简化版本，不传业务ID）
     */
    public String generatePath(String category, UUID userId, String fileName) {
        return generatePath(category, userId, fileName, null);
    }

    /**
     * 清理文件名，移除不安全字符
     */
    private String sanitizeFileName(String fileName) {
        if (fileName == null || fileName.trim().isEmpty()) {
            return "file";
        }

        // 移除路径分隔符和其他不安全字符
        String sanitized = fileName.replaceAll("[^a-zA-Z0-9._-]", "_");

        // 确保文件名不为空且有合理长度
        if (sanitized.length() > 100) {
            sanitized = sanitized.substring(0, 100);
        }

        return sanitized;
    }

    /**
     * 从文件名提取扩展名
     */
    public String getFileExtension(String fileName) {
        if (fileName == null || fileName.trim().isEmpty()) {
            return "";
        }

        int lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex > 0 && lastDotIndex < fileName.length() - 1) {
            return fileName.substring(lastDotIndex + 1).toLowerCase();
        }

        return "";
    }

    /**
     * 检测文件类型
     */
    public String detectFileType(String mimeType) {
        if (mimeType == null) {
            return "unknown";
        }

        if (mimeType.startsWith("image/")) {
            return "image";
        } else if (mimeType.startsWith("video/")) {
            return "video";
        } else if (mimeType.startsWith("audio/")) {
            return "audio";
        } else if (mimeType.contains("pdf") || mimeType.contains("document") || mimeType.contains("word")) {
            return "document";
        } else {
            return "file";
        }
    }
}