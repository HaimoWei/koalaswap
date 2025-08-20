package com.koalaswap.review.client;

import com.koalaswap.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.*;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class UserClient {

    /**
     * 使用内部匿名接口的 base url（本地 local: http://localhost:12649；容器内：http://user-service:8080）
     * 读取顺序：app.user-service.internal-base-url -> user-service.internal-base-url -> 环境变量 -> 默认
     */
    @Value("${app.user-service.internal-base-url:${user-service.internal-base-url:${APP_USER_SERVICE_INTERNAL_BASE_URL:http://user-service:8080}}}")
    private String baseUrl;

    private RestClient client() {
        return RestClient.builder().baseUrl(baseUrl).build();
    }

    /** 从当前请求中透传 Authorization（若存在），匿名接口可不带 */
    private void maybeAttachAuthHeader(RestClient.RequestHeadersSpec<?> spec) {
        try {
            var attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                String auth = attrs.getRequest().getHeader(HttpHeaders.AUTHORIZATION);
                if (auth != null && !auth.isBlank()) {
                    spec.header(HttpHeaders.AUTHORIZATION, auth);
                }
            }
        } catch (Exception ignore) {
        }
    }

    /**
     * 批量查询用户简介（匿名可用）
     * 调用：GET /api/internal/users/brief?ids=...&ids=...
     */
    public List<UserBrief> briefBatch(List<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        var distinct = ids.stream().filter(Objects::nonNull).distinct().collect(Collectors.toList());
        try {
            var type = new ParameterizedTypeReference<ApiResponse<List<UserBrief>>>() {};
            var spec = client().get().uri(uriBuilder -> {
                uriBuilder.path("/api/internal/users/brief");
                for (UUID id : distinct) {
                    uriBuilder.queryParam("ids", id);
                }
                return uriBuilder.build();
            }).header(HttpHeaders.ACCEPT, "application/json");

            // 匿名接口允许无 token；若当前请求有 Authorization，则透传（不影响匿名可用性）
            maybeAttachAuthHeader(spec);

            var resp = spec.retrieve().body(type);
            return (resp != null && resp.ok() && resp.data() != null) ? resp.data() : List.of();

        } catch (HttpClientErrorException.Unauthorized e) {
            // 理论上匿名接口不会返回 401，这里兜底为空，避免匿名场景 500
            return List.of();
        } catch (RestClientException e) {
            return List.of();
        }
    }

    /**
     * 单个查询用户简介（匿名可用）
     * 调用：GET /api/internal/users/{id}/brief
     */
    public UserBrief briefOne(UUID id) {
        if (id == null) return null;
        try {
            var type = new ParameterizedTypeReference<ApiResponse<UserBrief>>() {};
            var spec = client().get()
                    .uri("/api/internal/users/{id}/brief", id)
                    .header(HttpHeaders.ACCEPT, "application/json");

            maybeAttachAuthHeader(spec);

            var resp = spec.retrieve().body(type);
            return (resp != null) ? resp.data() : null;

        } catch (HttpClientErrorException.Unauthorized e) {
            return null;
        } catch (RestClientException e) {
            return null;
        }
    }

    /** 只包含页面渲染所需字段 */
    public record UserBrief(UUID id, String displayName, String avatarUrl) {}
}
