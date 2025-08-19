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

/**
 * 最小改动说明：
 * 1) 将上游请求的 Authorization 头透传到 user-service；
 * 2) 在下游 401（匿名/无效 token）或其它异常时，降级为返回空数据，避免把 401 变成 500。
 * 这样：
 *  - 匿名访问用户主页评论不再 500；
 *  - 已登录调用 /api/reviews/me/pending 能正常返回。
 */
@Component
@RequiredArgsConstructor
public class UserClient {

    @Value("${app.services.user.base-url:http://localhost:8081}")
    private String baseUrl;

    private RestClient client() {
        return RestClient.builder().baseUrl(baseUrl).build();
    }

    /**
     * 从当前请求上下文获取 Authorization 头（若无则返回 null）
     */
    private String currentAuthHeader() {
        try {
            var attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                String auth = attrs.getRequest().getHeader(HttpHeaders.AUTHORIZATION);
                if (auth != null && !auth.isBlank()) {
                    return auth;
                }
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    public List<UserBrief> briefBatch(List<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        var type = new ParameterizedTypeReference<ApiResponse<List<UserBrief>>>() {};
        var req = Map.of("ids", ids);
        try {
            var spec = client().post()
                    .uri("/api/users/brief")
                    .header(HttpHeaders.ACCEPT, "application/json")
                    .body(req);

            String auth = currentAuthHeader();
            if (auth != null) {
                spec = spec.header(HttpHeaders.AUTHORIZATION, auth);
            }

            var resp = spec.retrieve().body(type);
            return resp != null && resp.ok() && resp.data() != null ? resp.data() : List.of();

        } catch (HttpClientErrorException.Unauthorized e) {
            // 匿名或无效 token：降级为空列表，避免 500
            return List.of();
        } catch (RestClientException e) {
            // 下游不可用/超时等：也降级
            return List.of();
        }
    }

    public UserBrief briefOne(UUID id) {
        if (id == null) {
            return null;
        }
        var type = new ParameterizedTypeReference<ApiResponse<UserBrief>>() {};
        try {
            var spec = client().get()
                    .uri("/api/users/{id}/brief", id)
                    .header(HttpHeaders.ACCEPT, "application/json");

            String auth = currentAuthHeader();
            if (auth != null) {
                spec = spec.header(HttpHeaders.AUTHORIZATION, auth);
            }

            var resp = spec.retrieve().body(type);
            return resp != null ? resp.data() : null;

        } catch (HttpClientErrorException.Unauthorized e) {
            // 匿名/无效 token：降级为 null
            return null;
        } catch (RestClientException e) {
            return null;
        }
    }

    public record UserBrief(UUID id, String displayName, String avatarUrl) {}
}
