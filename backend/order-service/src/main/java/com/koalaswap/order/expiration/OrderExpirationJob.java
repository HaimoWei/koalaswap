package com.koalaswap.order.expiration;

import com.koalaswap.order.model.OrderStatus;
import com.koalaswap.order.repository.OrderRepository;
import com.koalaswap.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;

import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderExpirationJob {

    private final OrderRepository orders;
    private final OrderService orderService;

    @Value("${app.order.pending-expire-minutes:30}")
    private int expireMinutes;

    /** 每分钟扫一次，每次最多处理 100 条（幂等） */
    @Scheduled(fixedDelayString = "PT1M")
    public void autoCancelExpired() {
        try {
            var deadline = Instant.now().minusSeconds(expireMinutes * 60L);
            var page = orders.findByStatusAndCreatedAtBefore(OrderStatus.PENDING, deadline, PageRequest.of(0, 100));
            page.forEach(o -> {
                boolean ok = orderService.expireAndCancel(o.getId());
                if (ok) log.debug("order expired & cancelled: {}", o.getId());
            });
        } catch (Exception e) {
            log.warn("autoCancelExpired error: {}", e.toString());
        }
    }
}
