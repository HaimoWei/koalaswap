package com.koalaswap.order.model;

/** 必须与数据库枚举 order_status 一致 */
public enum OrderStatus {
    PENDING, PAID, SHIPPED, COMPLETED, CANCELLED
}
