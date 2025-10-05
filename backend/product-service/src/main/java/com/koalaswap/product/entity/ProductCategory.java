// product-service/src/main/java/com/koalaswap/product/entity/ProductCategory.java
package com.koalaswap.product.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "product_categories")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "name", nullable = false, length = 120, unique = true)
    private String name;

    @Column(name = "parent_id")
    private Integer parentId;
}