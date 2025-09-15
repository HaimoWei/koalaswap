// backend/user-service/src/main/java/com/koalaswap/user/dto/AddressRes.java
package com.koalaswap.user.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * 地址信息响应体。
 * 用于返回用户地址列表和单个地址详情。
 */
public record AddressRes(
        UUID id,                    // 地址ID
        String receiverName,        // 收件人姓名
        String phone,               // 收件人电话
        String province,            // 省份
        String city,                // 城市
        String district,            // 区/县
        String detailAddress,       // 详细地址
        String postalCode,          // 邮政编码（可选）
        boolean isDefault,          // 是否为默认地址
        Instant createdAt,          // 创建时间
        Instant updatedAt           // 更新时间
) {}