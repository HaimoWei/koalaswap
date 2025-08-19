package com.koalaswap.review.client;

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

@Slf4j @Component @RequiredArgsConstructor
public class ProductClient {
    @Value("${app.services.product.base-url:http://localhost:8082}")
    private String baseUrl;

    private RestClient client() { return RestClient.builder().baseUrl(baseUrl).build(); }

    public ProductBrief getBrief(UUID productId) {
        var type = new ParameterizedTypeReference<ApiResponse<ProductBrief>>(){};
        var resp = client().get().uri("/api/products/{id}", productId)
                .header(HttpHeaders.ACCEPT, "application/json")
                .retrieve().body(type);
        if (resp != null && resp.ok() && resp.data() != null) return resp.data();
        throw new IllegalArgumentException("商品不存在");
    }

    public record ProductBrief(UUID id, UUID sellerId, String title, BigDecimal price, String currency, boolean active) {}
}
