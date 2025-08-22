package com.koalaswap.order.client;

import com.koalaswap.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.UUID;

/** order-service 调 product-service 的轻量客户端 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ProductClient {

    private final RestClient rest = RestClient.create();

    @Value("${app.product-service.internal-base-url}")
    private String productServiceBaseUrl; // 例：http://localhost:12648

    private RestClient client() {
        return RestClient.builder().baseUrl(productServiceBaseUrl).build();
    }

    /** 读取商品（外部接口 /api/products/{id}），用于下单前校验状态/卖家等 */
    public ProductBrief getProduct(UUID id) {
        var type = new ParameterizedTypeReference<ApiResponse<ProductBrief>>() {};
        var resp = client().get()
                .uri("/api/products/{id}", id)
                .header(HttpHeaders.ACCEPT, "application/json")
                .retrieve()
                .body(type);
        if (resp == null || !resp.ok() || resp.data() == null) {
            throw new IllegalArgumentException("商品不存在");
        }
        return resp.data();
    }

    /** 占用：ACTIVE -> RESERVED */
    public boolean reserve(UUID productId) {
        var type = new ParameterizedTypeReference<ApiResponse<Boolean>>() {};
        var resp = client().post().uri("/api/internal/products/{id}/reserve", productId).retrieve().body(type);
        return resp != null && Boolean.TRUE.equals(resp.data());
    }

    /** 释放：RESERVED -> ACTIVE（不处理 SOLD） */
    public boolean release(UUID productId) {
        var type = new ParameterizedTypeReference<ApiResponse<Boolean>>() {};
        var resp = client().post().uri("/api/internal/products/{id}/release", productId).retrieve().body(type);
        return resp != null && Boolean.TRUE.equals(resp.data());
    }

    /** 标记 SOLD（支付后） */
    public boolean markSold(UUID productId) {
        var type = new ParameterizedTypeReference<ApiResponse<Boolean>>() {};
        var resp = client().post().uri("/api/internal/products/{id}/sold", productId).retrieve().body(type);
        return resp != null && Boolean.TRUE.equals(resp.data());
    }

    /** 新增：无条件激活（取消/超时后把 SOLD/RESERVED/HIDDEN 一律切回 ACTIVE） */
    public boolean activate(UUID productId) {
        var type = new ParameterizedTypeReference<ApiResponse<Boolean>>() {};
        var resp = client().post().uri("/api/internal/products/{id}/activate", productId).retrieve().body(type);
        return resp != null && Boolean.TRUE.equals(resp.data());
    }

    /** 与 product-service 的 ProductRes 字段保持一致的轻量视图 */
    public enum ProductStatus { ACTIVE, RESERVED, SOLD, HIDDEN }

    public record ProductBrief(
            UUID id,
            UUID sellerId,
            String title,
            BigDecimal price,
            String currency,
            ProductStatus status
    ) {}
}
