package com.koalaswap.order.repository;

import com.koalaswap.order.entity.OrderEntity;
import com.koalaswap.order.model.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<OrderEntity, UUID> {

    // 用于“防止同一商品被重复下单”：检查是否存在“进行中”的订单
    boolean existsByProductIdAndStatusIn(UUID productId, Collection<OrderStatus> statuses);

    // —— 列表查询：带状态 —— //
    Page<OrderEntity> findByBuyerIdAndStatus(UUID buyerId, OrderStatus status, Pageable pageable);
    Page<OrderEntity> findBySellerIdAndStatus(UUID sellerId, OrderStatus status, Pageable pageable);

    // —— 列表查询：不带状态（查全部） —— //
    Page<OrderEntity> findByBuyerId(UUID buyerId, Pageable pageable);
    Page<OrderEntity> findBySellerId(UUID sellerId, Pageable pageable);
}
