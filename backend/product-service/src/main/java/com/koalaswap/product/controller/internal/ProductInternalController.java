package com.koalaswap.product.controller.internal;

import com.koalaswap.common.dto.ApiResponse;
import com.koalaswap.product.service.ProductInternalService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * 内部接口：供 order-service 调用进行状态切换
 */
@RestController
@RequestMapping("/api/internal/products")
@RequiredArgsConstructor
public class ProductInternalController {
    private final ProductInternalService internal;

    @PostMapping("/{id}/reserve")
    public ApiResponse<Boolean> reserve(@PathVariable UUID id) {
        return ApiResponse.ok(internal.reserve(id));
    }

    @PostMapping("/{id}/release")
    public ApiResponse<Boolean> release(@PathVariable UUID id) {
        return ApiResponse.ok(internal.release(id));
    }

    @PostMapping("/{id}/sold")
    public ApiResponse<Boolean> sold(@PathVariable UUID id) {
        return ApiResponse.ok(internal.markSold(id));
    }

    /** 新增：无条件激活（订单取消/超时等场景使用） */
    @PostMapping("/{id}/activate")
    public ApiResponse<Boolean> activate(@PathVariable UUID id) {
        return ApiResponse.ok(internal.activate(id));
    }
}
