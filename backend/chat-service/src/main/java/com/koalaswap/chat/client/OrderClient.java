// chat-service/src/main/java/com/koalaswap/chat/client/OrderClient.java
package com.koalaswap.chat.client;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.koalaswap.chat.config.ExternalServicesProperties;
import com.koalaswap.chat.model.OrderStatus;
import com.koalaswap.common.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class OrderClient {
    private final RestTemplate rt;
    private final ExternalServicesProperties props;
    private final ObjectMapper om = new ObjectMapper();

    public OrderClient(RestTemplate rt, ExternalServicesProperties props) {
        this.rt = rt; this.props = props;
    }

    public static record OrderBrief(UUID id, OrderStatus status) {}

    public Map<UUID, OrderBrief> batchBrief(Collection<UUID> ids) {
        if (ids == null || ids.isEmpty()) return Collections.emptyMap();

        List<UUID> distinct = ids.stream().filter(Objects::nonNull).distinct().toList();

        String base = props.getOrderBaseUrl() + "/api/internal/orders/brief/batch";
        UriComponentsBuilder b = UriComponentsBuilder.fromHttpUrl(base);
        distinct.forEach(id -> b.queryParam("ids", id.toString())); // /brief/batch?ids=...&ids=...
        String url = b.toUriString();

        try {
            ResponseEntity<String> resp = rt.getForEntity(url, String.class);
            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                return Collections.emptyMap();
            }

            ApiResponse<List<OrderBrief>> wrapped = om.readValue(
                    resp.getBody(), new TypeReference<ApiResponse<List<OrderBrief>>>() {}
            );
            List<OrderBrief> list = wrapped.data() == null ? List.of() : wrapped.data();

            Map<UUID, OrderBrief> out = new LinkedHashMap<>();
            for (OrderBrief o : list) {
                if (o != null && o.id() != null) {
                    out.putIfAbsent(o.id(), o);
                }
            }
            return out;
        } catch (Exception e) {
            return Collections.emptyMap(); // 出错降级为空
        }
    }
}
