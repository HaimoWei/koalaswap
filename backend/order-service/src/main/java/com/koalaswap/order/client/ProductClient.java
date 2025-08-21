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

/**
 * 拉取商品信息（卖家ID、价格、是否可售）
 * - 仅在创建订单时使用
 */
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

    /** 读取商品（对外接口 /api/products/{id}，用于校验 active、卖家等） */
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

    public boolean reserve(UUID productId) {
        var type = new ParameterizedTypeReference<ApiResponse<Boolean>>() {};
        var resp = client().post()
                .uri("/api/internal/products/{id}/reserve", productId)
                .retrieve().body(type);
        return resp != null && Boolean.TRUE.equals(resp.data());
    }

    public boolean release(UUID productId) {
        var type = new ParameterizedTypeReference<ApiResponse<Boolean>>() {};
        var resp = client().post()
                .uri("/api/internal/products/{id}/release", productId)
                .retrieve().body(type);
        return resp != null && Boolean.TRUE.equals(resp.data());
    }


    public boolean markSold(UUID productId) {
        var type = new ParameterizedTypeReference<ApiResponse<Boolean>>() {};
        var resp = client().post()
                .uri("/api/internal/products/{id}/sold", productId)
                .retrieve().body(type);
        return resp != null && Boolean.TRUE.equals(resp.data());
    }

    /** 只取下单所需字段（保持与 product-service 的 ProductRes 字段名一致） */
    public record ProductBrief(
            UUID id,
            UUID sellerId,
            String title,
            BigDecimal price,
            String currency,
            boolean active
    ) {}
}
