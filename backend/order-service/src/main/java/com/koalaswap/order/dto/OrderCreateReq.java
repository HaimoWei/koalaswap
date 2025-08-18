package com.koalaswap.order.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

/** 创建订单请求 */
public record OrderCreateReq(
        @NotNull UUID productId,
        BigDecimal priceExpected,  // 可选：用于前端提示价格波动
        String note                // 可选：留言
) {}
