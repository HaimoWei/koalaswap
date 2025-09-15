// ===============================
// backend/product-service/src/main/java/com/koalaswap/product/entity/ProductImage.java
// 实体映射｜product_images：商品图片（支持 S3 云存储）
// ===============================
package com.koalaswap.product.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/** 商品图片表（支持云存储 + 完整元数据） */
@Entity
@Table(name = "product_images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductImage {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    // 兼容旧字段：完整的 CDN URL
    @Column(name = "image_url", columnDefinition = "TEXT")
    private String url;

    // 兼容旧字段：排序（保留以防回滚）
    @Column(name = "sort_order")
    private Integer sortOrder;

    // === 新增云存储字段 ===

    @Column(name = "object_key", columnDefinition = "TEXT")
    private String objectKey;  // S3对象键，如: product/uuid/timestamp-filename.jpg

    @Column(name = "is_primary")
    private Boolean isPrimary = false;  // 是否为主图

    @Column(name = "display_order")
    private Integer displayOrder = 0;  // 显示顺序

    @Column(name = "file_size")
    private Long fileSize;  // 文件大小（字节）

    @Column(name = "original_name")
    private String originalName;  // 原始文件名

    @Column(name = "mime_type", length = 100)
    private String mimeType;  // MIME类型

    @Column(name = "upload_status", length = 20)
    private String uploadStatus = "COMPLETED";  // 上传状态: UPLOADING, COMPLETED, FAILED

    @Column(name = "uploaded_by")
    private UUID uploadedBy;  // 上传者

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // === 构造方法 ===

    public ProductImage(UUID productId, String objectKey, String originalName,
                       Long fileSize, String mimeType, UUID uploadedBy) {
        this.productId = productId;
        this.objectKey = objectKey;
        this.originalName = originalName;
        this.fileSize = fileSize;
        this.mimeType = mimeType;
        this.uploadedBy = uploadedBy;
        this.uploadStatus = "UPLOADING";
        this.displayOrder = 0;
        this.isPrimary = false;
    }

    // === 业务方法 ===

    public void markAsCompleted(String cdnUrl) {
        this.uploadStatus = "COMPLETED";
        this.url = cdnUrl;
    }

    public void markAsFailed() {
        this.uploadStatus = "FAILED";
    }

    public boolean isCompleted() {
        return "COMPLETED".equals(this.uploadStatus);
    }

    public boolean isUploading() {
        return "UPLOADING".equals(this.uploadStatus);
    }
}
