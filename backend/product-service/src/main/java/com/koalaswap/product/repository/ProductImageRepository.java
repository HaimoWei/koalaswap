// ===============================
// backend/product-service/src/main/java/com/koalaswap/product/repository/ProductImageRepository.java
// 仓库｜图片查询 & 云存储支持
// ===============================
package com.koalaswap.product.repository;

import com.koalaswap.product.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;
import java.util.Optional;

public interface ProductImageRepository extends JpaRepository<ProductImage, UUID> {

    // === 兼容旧查询（基于 sort_order） ===
    List<ProductImage> findByProductIdOrderBySortOrderAsc(UUID productId);

    Optional<ProductImage> findFirstByProductIdOrderBySortOrderAsc(UUID productId);

    /** 全量替换前，先删除旧图；放在 Service 的事务中使用 */
    @Modifying
    @Query("delete from ProductImage i where i.productId = :pid")
    void deleteByProductId(@Param("pid") UUID productId);

    // === 新查询方法（基于 display_order + upload_status） ===

    /** 按显示顺序查询商品的已完成图片 */
    List<ProductImage> findByProductIdAndUploadStatusOrderByDisplayOrder(UUID productId, String uploadStatus);

    /** 按显示顺序查询商品的所有图片（包含上传中的） */
    List<ProductImage> findByProductIdOrderByDisplayOrder(UUID productId);

    /** 查询商品的主图（单个） */
    Optional<ProductImage> findFirstByProductIdAndIsPrimary(UUID productId, boolean isPrimary);

    /** 查询商品的所有主图（用于清除多个主图的情况） */
    List<ProductImage> findByProductIdAndIsPrimary(UUID productId, boolean isPrimary);

    /** 统计商品的图片数量（按状态） */
    long countByProductIdAndUploadStatus(UUID productId, String uploadStatus);

    /** 查询商品的最大显示顺序 */
    @Query("SELECT MAX(i.displayOrder) FROM ProductImage i WHERE i.productId = :productId")
    Integer findMaxDisplayOrderByProductId(@Param("productId") UUID productId);

    /** 查询指定对象键的图片 */
    Optional<ProductImage> findByObjectKey(String objectKey);

    /** 查询用户上传的图片 */
    List<ProductImage> findByUploadedByOrderByCreatedAtDesc(UUID uploadedBy);

    /** 清理失败的上传记录（定时任务用） */
    @Modifying
    @Query("DELETE FROM ProductImage i WHERE i.uploadStatus = 'FAILED' AND i.createdAt < :cutoffTime")
    void deleteFailedUploadsOlderThan(@Param("cutoffTime") java.time.LocalDateTime cutoffTime);

    /** 清理长时间未完成的上传记录（定时任务用） */
    @Modifying
    @Query("DELETE FROM ProductImage i WHERE i.uploadStatus = 'UPLOADING' AND i.createdAt < :cutoffTime")
    void deleteStaleUploadsOlderThan(@Param("cutoffTime") java.time.LocalDateTime cutoffTime);
}
