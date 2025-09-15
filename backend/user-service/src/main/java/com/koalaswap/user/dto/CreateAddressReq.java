// backend/user-service/src/main/java/com/koalaswap/user/dto/CreateAddressReq.java
package com.koalaswap.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 创建地址接口的请求体。
 * 使用 record：不可变数据载体，适合做 DTO。
 */
public record CreateAddressReq(
        @NotBlank @Size(min = 2, max = 100, message = "收件人姓名长度需在2-100个字符之间")
        String receiverName,        // 收件人姓名

        @NotBlank @Size(min = 10, max = 20, message = "电话号码长度需在10-20个字符之间")
        String phone,               // 收件人电话

        @NotBlank @Size(max = 50, message = "省份名称不能超过50个字符")
        String province,            // 省份

        @NotBlank @Size(max = 50, message = "城市名称不能超过50个字符")
        String city,                // 城市

        @NotBlank @Size(max = 50, message = "区县名称不能超过50个字符")
        String district,            // 区/县

        @NotBlank @Size(min = 5, message = "详细地址不能少于5个字符")
        String detailAddress,       // 详细地址（街道、门牌号等）

        @Size(max = 10, message = "邮政编码不能超过10个字符")
        String postalCode,          // 邮政编码（可选）

        Boolean isDefault           // 是否为默认地址（可选，默认false）
) {}