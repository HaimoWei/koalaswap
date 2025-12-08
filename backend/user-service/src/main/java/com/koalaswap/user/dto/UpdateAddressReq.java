// backend/user-service/src/main/java/com/koalaswap/user/dto/UpdateAddressReq.java
package com.koalaswap.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 更新地址接口的请求体。
 * 使用 record：不可变数据载体，适合做 DTO。
 */
public record UpdateAddressReq(
        @NotBlank @Size(min = 2, max = 100, message = "Recipient name must be between 2 and 100 characters long.")
        String receiverName,        // 收件人姓名

        @NotBlank @Size(min = 10, max = 20, message = "Phone number must be between 10 and 20 characters long.")
        String phone,               // 收件人电话

        @NotBlank @Size(max = 50, message = "Province name must not exceed 50 characters.")
        String province,            // 省份

        @NotBlank @Size(max = 50, message = "City name must not exceed 50 characters.")
        String city,                // 城市

        @NotBlank @Size(max = 50, message = "District name must not exceed 50 characters.")
        String district,            // 区/县

        @NotBlank @Size(min = 5, message = "Detailed address must be at least 5 characters long.")
        String detailAddress,       // 详细地址（街道、门牌号等）

        @Size(max = 10, message = "Postal code must not exceed 10 characters.")
        String postalCode,          // 邮政编码（可选）

        Boolean isDefault           // 是否为默认地址（可选）
) {}
