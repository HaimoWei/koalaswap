package com.koalaswap.user.entity;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * 映射数据库的 users 表。
 * 注意：我们没有让 JPA 去建表（ddl-auto: none），
 * 表结构已经在你的 schema.sql 里创建好了。
 */
@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor
public class User {

    /** 主键：UUID。这里用 Hibernate 的 @UuidGenerator 在应用侧生成 UUID；
     *  你数据库里也有 DEFAULT gen_random_uuid()，两者都行。
     *  如果你更想用“让数据库生成”，可以把 @UuidGenerator 去掉，并在插入时不手动设置 id。
     */
    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(columnDefinition = "uuid")
    private UUID id;

    /** 邮箱：唯一 */
    @Column(nullable = false, unique = true, length = 320)
    private String email;

    /** 密码哈希（明文密码绝不入库） */
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    /** 昵称 */
    @Column(name = "display_name", nullable = false, length = 120)
    private String displayName;

    /** 头像、个人简介 */
    @Column(name = "avatar_url")
    private String avatarUrl;

    private String bio;

    // 1) emailVerified：NOT NULL，默认 false。这里直接在 Java 层给默认值 false
    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = false;

    // 2) ratingAvg：NOT NULL NUMERIC(2,1)，默认 0。用 BigDecimal 避免浮点精度问题
    //    precision=2, scale=1 <=> NUMERIC(2,1)（总位数 2，小数 1），最大 9.9 足够 5.0 平均分
    @Column(name = "rating_avg", nullable = false, precision = 2, scale = 1)
    private BigDecimal ratingAvg = BigDecimal.ZERO;

    // 3) ratingCount：NOT NULL，默认 0。int 本身就不会为 null，再显式初值 0
    @Column(name = "rating_count", nullable = false)
    private int ratingCount = 0;

    // 插入时自动填充创建时间（由 Hibernate 在 INSERT 前赋值）
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "password_updated_at")
    private Instant passwordUpdatedAt;

}
