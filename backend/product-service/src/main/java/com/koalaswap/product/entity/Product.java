// ===============================
// backend/product-service/src/main/java/com/koalaswap/product/entity/Product.java
// 实体映射｜products：主表（最小可用字段集）
// ===============================
package com.koalaswap.product.entity;

import com.koalaswap.product.model.Condition;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * 商品主表（最小 MVP 字段）
 * - 注意 condition 使用 PostgreSQL enum 类型映射
 * - active 用于软删/下架
 */
@Entity
@Table(name = "products")
@Getter
@Setter
public class Product {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "seller_id", nullable = false)
    private UUID sellerId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false, length = 10)
    private String currency = "AUD";

    @Column(name = "category_id")
    private Integer categoryId;

    /** PostgreSQL enum：列类型须为 product_condition */
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)                    // ← 关键
    @Column(nullable = false, columnDefinition = "product_condition") // ← 你的 PG enum 名
    private Condition condition = Condition.GOOD;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
