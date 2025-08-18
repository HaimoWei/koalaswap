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

    public ProductBrief getProduct(UUID productId) {
        try {
            var type = new ParameterizedTypeReference<ApiResponse<ProductBrief>>() {};
            var resp = rest.get()
                    .uri(productServiceBaseUrl.replaceAll("/+$","") + "/api/products/{id}", productId)
                    .header(HttpHeaders.ACCEPT, "application/json")
                    .retrieve()
                    .body(type);
            if (resp == null || !resp.ok() || resp.data() == null) {
                throw new IllegalStateException("商品不存在或服务返回异常");
            }
            return resp.data();
        } catch (Exception e) {
            throw new IllegalArgumentException("商品不存在或不可用");
        }
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
