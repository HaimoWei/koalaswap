package com.koalaswap.review.client;

import com.koalaswap.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.*;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ProductClient {

    /**
     * review-service ⟶ product-service 内部调用基地址
     * 本地容器默认：http://product-service:8080
     */
    @Value("${app.product-service.internal-base-url:${product-service.internal-base-url:${APP_PRODUCT_SERVICE_INTERNAL_BASE_URL:http://product-service:8080}}}")
    private String baseUrl;

    private RestClient client() {
        return RestClient.builder().baseUrl(baseUrl).build();
    }

    /** 单个 brief：GET /api/internal/products/brief/{id} */
    public ProductBrief oneBrief(UUID id) {
        if (id == null) return null;
        var type = new ParameterizedTypeReference<ApiResponse<ProductBrief>>() {};
        var resp = client().get()
                .uri("/api/internal/products/brief/{id}", id)
                .header(HttpHeaders.ACCEPT, "application/json")
                .retrieve()
                .body(type);
        return resp != null ? resp.data() : null;
    }

    /** 批量 brief：GET /api/internal/products/brief/batch?ids=... */
    public List<ProductBrief> batchBrief(Collection<UUID> ids) {
        if (ids == null || ids.isEmpty()) return List.of();
        List<UUID> distinct = ids.stream().filter(Objects::nonNull).distinct().collect(Collectors.toList());
        var type = new ParameterizedTypeReference<ApiResponse<List<ProductBrief>>>() {};
        var resp = client().get().uri(uri -> {
                    uri.path("/api/internal/products/brief/batch");
                    for (UUID id : distinct) uri.queryParam("ids", id);
                    return uri.build();
                }).header(HttpHeaders.ACCEPT, "application/json")
                .retrieve()
                .body(type);
        return (resp != null && resp.data() != null) ? resp.data() : List.of();
    }

    /** 与 product internal brief 对齐的字段 */
    public record ProductBrief(UUID id, UUID sellerId, String firstImageUrl, String title) {}

    /* —— 可选：老方法留兼容（不再使用） —— */
    @Deprecated
    public ProductBrief getBrief(UUID productId) {
        return oneBrief(productId);
    }
}
