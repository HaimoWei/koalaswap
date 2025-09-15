package com.koalaswap.order.service;

import com.koalaswap.order.client.ProductClient;
import com.koalaswap.order.dto.*;
import com.koalaswap.order.entity.OrderEntity;
import com.koalaswap.order.events.OrderCompletedEvent;
import com.koalaswap.order.model.OrderStatus;
import com.koalaswap.order.repository.OrderRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final ApplicationEventPublisher publisher;
    private final OrderRepository orders;
    private final ProductClient productClient;

    private static final Set<OrderStatus> OPEN = EnumSet.of(
            OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.SHIPPED
    );

    /** 创建订单（买家发起） */
    @Transactional
    public OrderRes create(UUID buyerId, OrderCreateReq req) {
        var p = productClient.getProduct(req.productId());
        if (p.status() != ProductClient.ProductStatus.ACTIVE) {
            throw new IllegalArgumentException("该商品已下架或不可售");
        }
        if (buyerId.equals(p.sellerId())) {
            throw new IllegalArgumentException("不能购买自己的商品");
        }
        // 并发占用检查
        if (orders.existsByProductIdAndStatusIn(p.id(), OPEN)) {
            throw new IllegalArgumentException("该商品已有进行中的订单");
        }
        // 占用：ACTIVE -> RESERVED
        if (!productClient.reserve(p.id())) {
            throw new IllegalArgumentException("该商品已被下单，请刷新后重试");
        }

        var e = new OrderEntity();
        e.setProductId(p.id());
        e.setBuyerId(buyerId);
        e.setSellerId(p.sellerId());
        e.setPriceSnapshot(p.price());
        e.setStatus(OrderStatus.PENDING);
        // 设置收货地址
        if (req.shippingAddressId() != null) {
            e.setShippingAddressId(req.shippingAddressId());
        }
        var saved = orders.save(e);
        // 发布 PENDING 事件
        publisher.publishEvent(new com.koalaswap.order.events.OrderStatusChangedEvent(
                saved.getId(), saved.getProductId(), saved.getBuyerId(), saved.getSellerId(),
                OrderStatus.PENDING, saved.getCreatedAt()
        ));
        return toRes(saved);
    }

    /** 订单详情（参与者可见） */
    public OrderRes get(UUID userId, UUID id) {
        var e = orders.findById(id).orElseThrow(() -> new IllegalArgumentException("订单不存在"));
        assertParticipant(e, userId);
        return toRes(e);
    }

    /** 我买到的/我卖出的（可按状态过滤） */
    public Page<OrderRes> list(UUID userId, String role, OrderStatus status, int page, int size, String sortParam) {
        var pageable = PageRequest.of(Math.max(0,page), Math.min(100, Math.max(1,size)), safeSort(sortParam));
        Page<OrderEntity> pageData;
        boolean buyer = "buyer".equalsIgnoreCase(role);
        boolean seller = "seller".equalsIgnoreCase(role);
        if (!buyer && !seller) throw new IllegalArgumentException("role 只能为 buyer 或 seller");
        if (buyer) {
            pageData = (status == null) ? orders.findByBuyerId(userId, pageable) : orders.findByBuyerIdAndStatus(userId, status, pageable);
        } else {
            pageData = (status == null) ? orders.findBySellerId(userId, pageable) : orders.findBySellerIdAndStatus(userId, status, pageable);
        }
        return pageData.map(this::toRes);
    }

    /** 支付（模拟）：PENDING -> PAID，仅买家；并标记商品 SOLD */
    @Transactional
    public OrderRes pay(UUID buyerId, UUID id, PayReq req) {
        var e = orders.findById(id).orElseThrow(() -> new IllegalArgumentException("订单不存在"));
        if (!e.getBuyerId().equals(buyerId)) throw new IllegalArgumentException("只能支付自己的订单");
        if (e.getStatus() == OrderStatus.CANCELLED || e.getStatus() == OrderStatus.COMPLETED) return toRes(e);
        if (e.getStatus() != OrderStatus.PENDING) return toRes(e); // 幂等：非 PENDING 直接返回

        e.setStatus(OrderStatus.PAID);
        var saved = orders.save(e);
        // 支付后：商品 SOLD（幂等）
        productClient.markSold(e.getProductId());
        // 发布 PAID 事件
        publisher.publishEvent(new com.koalaswap.order.events.OrderStatusChangedEvent(
                saved.getId(), saved.getProductId(), saved.getBuyerId(), saved.getSellerId(),
                OrderStatus.PAID, java.time.Instant.now()
        ));
        return toRes(saved);
    }

    /** 发货：PAID -> SHIPPED，仅卖家 */
    @Transactional
    public OrderRes ship(UUID sellerId, UUID id, ShipReq req) {
        var e = orders.findById(id).orElseThrow(() -> new IllegalArgumentException("订单不存在"));
        if (!e.getSellerId().equals(sellerId)) throw new IllegalArgumentException("只能发自己售出的订单");
        if (e.getStatus() == OrderStatus.CANCELLED || e.getStatus() == OrderStatus.COMPLETED) return toRes(e);
        if (e.getStatus() != OrderStatus.PAID) throw new IllegalArgumentException("当前状态不可发货");

        e.setStatus(OrderStatus.SHIPPED);
        var saved = orders.save(e);
        // 发布 SHIPPED 事件
        publisher.publishEvent(new com.koalaswap.order.events.OrderStatusChangedEvent(
                saved.getId(), saved.getProductId(), saved.getBuyerId(), saved.getSellerId(),
                OrderStatus.SHIPPED, java.time.Instant.now()
        ));
        return toRes(saved);
    }

    /** 确认收货：SHIPPED -> COMPLETED，仅买家；保留商品 SOLD */
    @Transactional
    public OrderRes confirm(UUID buyerId, UUID id) {
        var e = orders.findById(id).orElseThrow(() -> new IllegalArgumentException("订单不存在"));
        if (!e.getBuyerId().equals(buyerId)) throw new IllegalArgumentException("只能确认自己的订单");
        if (e.getStatus() == OrderStatus.CANCELLED || e.getStatus() == OrderStatus.COMPLETED) return toRes(e);
        if (e.getStatus() != OrderStatus.SHIPPED) throw new IllegalArgumentException("当前状态不可确认收货");

        e.setStatus(OrderStatus.COMPLETED);
        e.setClosedAt(Instant.now());
        var saved = orders.save(e);

        // 发布订单完成事件（review-service 使用）
        publisher.publishEvent(new OrderCompletedEvent(saved.getId(), saved.getBuyerId(), saved.getSellerId(), saved.getProductId(), saved.getClosedAt()));
        // 同步发布 COMPLETED 状态变更事件（chat-service 使用）
        publisher.publishEvent(new com.koalaswap.order.events.OrderStatusChangedEvent(
                saved.getId(), saved.getProductId(), saved.getBuyerId(), saved.getSellerId(),
                OrderStatus.COMPLETED, saved.getClosedAt()
        ));
        return toRes(saved);
    }

    /** 取消：买家 PENDING/PAID；卖家 PENDING */
    @Transactional
    public OrderRes cancel(UUID actorId, UUID id, CancelReq req) {
        var e = orders.findById(id).orElseThrow(() -> new IllegalArgumentException("订单不存在"));
        boolean seller = e.getSellerId().equals(actorId);
        boolean buyer = e.getBuyerId().equals(actorId);
        if (!seller && !buyer) throw new AccessDeniedException("只能由买家/卖家取消订单");

        switch (e.getStatus()) {
            case CANCELLED, COMPLETED -> {
                // 明确拒绝再次取消
                throw new AccessDeniedException("该订单已完成或已取消，无法再次取消");
            }
            case PENDING -> {
                // 取消：恢复商品 ACTIVE（无条件）
                productClient.activate(e.getProductId());
                e.setStatus(OrderStatus.CANCELLED);
                e.setClosedAt(Instant.now());
                var saved = orders.save(e);
                // 发布 CANCELLED 事件
                publisher.publishEvent(new com.koalaswap.order.events.OrderStatusChangedEvent(
                        saved.getId(), saved.getProductId(), saved.getBuyerId(), saved.getSellerId(),
                        OrderStatus.CANCELLED, saved.getClosedAt()
                ));
                return toRes(saved);
            }
            case PAID -> {
                // 仅买家可取消：恢复商品 ACTIVE（无条件）
                if (!buyer) throw new AccessDeniedException("仅买家可在已支付状态取消");
                productClient.activate(e.getProductId());
                e.setStatus(OrderStatus.CANCELLED);
                e.setClosedAt(Instant.now());
                var saved = orders.save(e);
                publisher.publishEvent(new com.koalaswap.order.events.OrderStatusChangedEvent(
                        saved.getId(), saved.getProductId(), saved.getBuyerId(), saved.getSellerId(),
                        OrderStatus.CANCELLED, saved.getClosedAt()
                ));
                return toRes(saved);
            }
            case SHIPPED -> throw new AccessDeniedException("订单已发货，无法取消");
            default -> throw new IllegalStateException("未知状态：" + e.getStatus());
        }
    }

    /** 系统自动过期：PENDING 超时 -> CANCELLED，并恢复商品 ACTIVE（无条件） */
    @Transactional
    public boolean expireAndCancel(UUID id) {
        var e = orders.findById(id).orElse(null);
        if (e == null || e.getStatus() != OrderStatus.PENDING) return false;

        productClient.activate(e.getProductId());
        e.setStatus(OrderStatus.CANCELLED);
        e.setClosedAt(Instant.now());
        orders.save(e);
        return true;
    }

    // ---------- helpers ----------
    private void assertParticipant(OrderEntity e, UUID userId) {
        if (!Objects.equals(e.getBuyerId(), userId) && !Objects.equals(e.getSellerId(), userId)) {
            throw new IllegalArgumentException("无权访问该订单");
        }
    }

    private OrderRes toRes(OrderEntity e) {
        return new OrderRes(
                e.getId(),
                e.getProductId(),
                e.getBuyerId(),
                e.getSellerId(),
                e.getPriceSnapshot(),
                e.getStatus(),
                e.getShippingAddressId(),
                e.getShippingAddressSnapshot(),
                e.getCreatedAt(),
                e.getClosedAt()
        );
    }

    private static Sort safeSort(String sortParam) {
        if (sortParam == null || sortParam.isBlank()) return Sort.by(Sort.Order.desc("createdAt"));
        var parts = sortParam.split(",");
        var field = parts[0].trim();
        var dir = parts.length > 1 ? parts[1].trim().toLowerCase(Locale.ROOT) : "desc";
        Set<String> allowed = Set.of("createdAt", "priceSnapshot");
        if (!allowed.contains(field)) field = "createdAt";
        var direction = "asc".equals(dir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(new Sort.Order(direction, field));
    }
}
