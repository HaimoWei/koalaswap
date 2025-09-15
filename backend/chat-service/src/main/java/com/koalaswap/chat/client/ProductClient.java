// chat-service/src/main/java/com/koalaswap/chat/client/ProductClient.java
package com.koalaswap.chat.client;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.koalaswap.chat.config.ExternalServicesProperties;
import com.koalaswap.common.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.util.*;

@Component
public class ProductClient {
    private final RestTemplate rt;
    private final ExternalServicesProperties props;
    private final ObjectMapper om = new ObjectMapper();

    public ProductClient(RestTemplate rt, ExternalServicesProperties props) {
        this.rt = rt; this.props = props;
    }

    /** chat-service 内部使用 */
    public static record ProductBrief(UUID id, UUID sellerId, String firstImageUrl, String title, BigDecimal price) {}

    /** 对应 product-service 的返回结构（ApiResponse.data 内部的元素） */
    private static record ProductBriefRes(UUID id, UUID sellerId, String firstImageUrl, String title, BigDecimal price) {}

    /** 批量 brief：GET /api/internal/products/brief/batch?ids=...&ids=...  返回 ApiResponse<List<ProductBriefRes>> */
    public Map<UUID, ProductBrief> batchBrief(Collection<UUID> ids) {
        if (ids == null || ids.isEmpty()) return Collections.emptyMap();

        List<UUID> distinct = ids.stream().filter(Objects::nonNull).distinct().toList();

        String base = props.getProductBaseUrl() + "/api/internal/products/brief/batch";
        UriComponentsBuilder b = UriComponentsBuilder.fromHttpUrl(base);
        distinct.forEach(id -> b.queryParam("ids", id.toString()));
        String url = b.toUriString();

        try {
            ResponseEntity<String> resp = rt.getForEntity(url, String.class);
            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) return Collections.emptyMap();

            ApiResponse<List<ProductBriefRes>> wrapped = om.readValue(
                    resp.getBody(), new TypeReference<ApiResponse<List<ProductBriefRes>>>() {}
            );
            List<ProductBriefRes> list = wrapped.data() == null ? List.of() : wrapped.data();

            Map<UUID, ProductBrief> out = new LinkedHashMap<>();
            for (ProductBriefRes p : list) {
                if (p != null && p.id() != null) {
                    out.putIfAbsent(p.id(), new ProductBrief(p.id(), p.sellerId(), p.firstImageUrl(), p.title(), p.price()));
                }
            }
            return out;
        } catch (Exception e) {
            return Collections.emptyMap(); // 出错降级为空
        }
    }

    /** 单查 brief：GET /api/internal/products/brief/{id}  返回 ApiResponse<ProductBriefRes> */
    public Optional<ProductBrief> getBrief(UUID productId) {
        String url = props.getProductBaseUrl() + "/api/internal/products/brief/" + productId;
        try {
            ResponseEntity<String> resp = rt.getForEntity(url, String.class);
            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) return Optional.empty();

            ApiResponse<ProductBriefRes> wrapped = om.readValue(
                    resp.getBody(), new TypeReference<ApiResponse<ProductBriefRes>>() {}
            );
            ProductBriefRes p = wrapped.data();
            if (p == null || p.id() == null) return Optional.empty();

            return Optional.of(new ProductBrief(p.id(), p.sellerId(), p.firstImageUrl(), p.title(), p.price()));
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
