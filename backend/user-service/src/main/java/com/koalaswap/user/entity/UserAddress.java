package com.koalaswap.user.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * 映射数据库的 user_addresses 表。
 * 用户收货地址管理实体。
 */
@Entity
@Table(name = "user_addresses")
@Getter @Setter @NoArgsConstructor
public class UserAddress {

    /** 主键：UUID */
    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(columnDefinition = "uuid")
    private UUID id;

    /** 用户ID：外键关联到users表 */
    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    /** 收件人姓名 */
    @Column(name = "receiver_name", nullable = false, length = 100)
    private String receiverName;

    /** 收件人电话 */
    @Column(name = "phone", nullable = false, length = 20)
    private String phone;

    /** 省份 */
    @Column(name = "province", nullable = false, length = 50)
    private String province;

    /** 城市 */
    @Column(name = "city", nullable = false, length = 50)
    private String city;

    /** 区/县 */
    @Column(name = "district", nullable = false, length = 50)
    private String district;

    /** 详细地址（街道、门牌号等） */
    @Column(name = "detail_address", nullable = false, columnDefinition = "TEXT")
    private String detailAddress;

    /** 邮政编码（可选） */
    @Column(name = "postal_code", length = 10)
    private String postalCode;

    /** 是否为默认地址 */
    @Column(name = "is_default", nullable = false)
    private boolean isDefault = false;

    /** 创建时间（由 Hibernate 在 INSERT 前赋值） */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /** 更新时间（由数据库触发器自动更新） */
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /** 确保插入时不触发 NOT NULL 约束 */
    @PrePersist
    void prePersist() {
        if (updatedAt == null) {
            updatedAt = Instant.now(); // 与 schema 默认 NOW() 对齐
        }
    }
}