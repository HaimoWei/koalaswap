// chat-service/src/main/java/com/koalaswap/chat/client/UserClient.java
package com.koalaswap.chat.client;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.koalaswap.chat.config.ExternalServicesProperties;
import com.koalaswap.common.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class UserClient {
    private final RestTemplate rt;
    private final ExternalServicesProperties props;
    private final ObjectMapper om = new ObjectMapper();

    public UserClient(RestTemplate rt, ExternalServicesProperties props) {
        this.rt = rt; this.props = props;
    }

    /** chat-service 内部使用的简要用户信息（注意 nickname 字段名与后端 displayName 的映射） */
    public static record UserBrief(UUID id, String displayName, String avatarUrl) {}

    /** 对应 user-service 返回的字段：id, displayName, avatarUrl */
    private static record UserBriefRes(UUID id, String displayName, String avatarUrl) {}

    public Map<UUID, UserBrief> batchBrief(Collection<UUID> ids) {
        if (ids == null || ids.isEmpty()) return Collections.emptyMap();

        List<UUID> distinct = ids.stream().filter(Objects::nonNull).distinct().toList();

        String base = props.getUserBaseUrl() + "/api/internal/users/brief";
        UriComponentsBuilder b = UriComponentsBuilder.fromHttpUrl(base);
        distinct.forEach(id -> b.queryParam("ids", id.toString())); // /brief?ids=...&ids=...
        String url = b.toUriString();

        try {
            ResponseEntity<String> resp = rt.getForEntity(url, String.class);
            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                return Collections.emptyMap();
            }

            ApiResponse<List<UserBriefRes>> wrapped = om.readValue(
                    resp.getBody(), new TypeReference<ApiResponse<List<UserBriefRes>>>() {}
            );
            List<UserBriefRes> list = wrapped.data() == null ? List.of() : wrapped.data();

            // 用显式 Map 累加，避免 IDE 对 toMap 的合并函数推断报红
            Map<UUID, UserBrief> out = new LinkedHashMap<>();
            for (UserBriefRes u : list) {
                if (u != null && u.id() != null) {
                    out.putIfAbsent(u.id(), new UserBrief(u.id(), u.displayName(), u.avatarUrl()));
                }
            }
            return out;
        } catch (Exception e) {
            return Collections.emptyMap(); // 出错降级为空
        }
    }
}
