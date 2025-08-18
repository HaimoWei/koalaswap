package com.koalaswap.order.entity;

import com.koalaswap.order.model.OrderStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * 对应表：orders（KoalaSwap_Schema_v1.1）
 * 注意：status 列类型是 PostgreSQL 自定义枚举 order_status
 */
@Entity
@Table(name = "orders")
@Getter @Setter
public class OrderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "buyer_id", nullable = false)
    private UUID buyerId;

    @Column(name = "seller_id", nullable = false)
    private UUID sellerId;

    @Column(name = "price_snapshot", nullable = false)
    private BigDecimal priceSnapshot;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)               // 关键：按 PG 枚举绑定参数
    @Column(name = "status", nullable = false, columnDefinition = "order_status")
    private OrderStatus status;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "closed_at")
    private Instant closedAt;

    @Version
    private Long version; // 乐观锁，避免并发踩踏
}
