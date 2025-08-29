// ===============================
// backend/product-service/src/main/java/com/koalaswap/product/entity/ProductImage.java
// 实体映射｜product_images：商品图片（按 sort_order 排序）
// ===============================
package com.koalaswap.product.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/** 商品图片表（简单起见：本阶段全量替换策略） */
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

    @Column(name = "image_url", nullable = false, columnDefinition = "TEXT")
    private String url;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;
}
