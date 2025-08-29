// src/main/java/com/koalaswap/chat/model/OrderStatus.java
package com.koalaswap.chat.model;       // ★ 必须有这个包声明
/** 与数据库 enum order_status 完全一致 */
public enum OrderStatus {
    PENDING, PAID, SHIPPED, COMPLETED, CANCELLED
}
