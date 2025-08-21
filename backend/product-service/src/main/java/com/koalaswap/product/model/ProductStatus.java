package com.koalaswap.product.model;

/** 必须与 PG 枚举 product_status 一致 */
public enum ProductStatus {
    ACTIVE,   // 可售（可被搜索/购买）
    RESERVED,  // 已被下单占用（暂不可搜索/购买）
    SOLD,      // 已售出（交易完成/已支付）
    HIDDEN     // 卖家隐藏/软删除（不可搜索）
}
