// ===============================
// backend/product-service/src/main/java/com/koalaswap/product/entity/Category.java
// 实体映射｜product_categories：分类表（支持多级层次结构）
// ===============================
package com.koalaswap.product.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * 商品分类实体
 * - 支持父子层级结构（parent_id）
 * - 对应数据库表：product_categories
 */
@Entity
@Table(name = "product_categories")
@Getter
@Setter
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 120, unique = true)
    private String name;

    @Column(name = "parent_id")
    private Integer parentId;
}