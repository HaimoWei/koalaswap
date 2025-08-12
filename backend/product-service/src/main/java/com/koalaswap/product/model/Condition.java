// ===============================
// backend/product-service/src/main/java/com/koalaswap/product/model/Condition.java
// 领域枚举｜与 PostgreSQL enum `product_condition` 对齐
// ===============================
package com.koalaswap.product.model;

/** 商品成色枚举（与数据库枚举一一对应） */
public enum Condition {
    NEW, LIKE_NEW, GOOD, FAIR, POOR
}
