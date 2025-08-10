package com.koalaswap.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

/**
 * 数据库表 email_verification_tokens 对应的实体类
 * 用来记录每次生成的邮箱验证 Token
 */
@Entity
@Table(name="email_verification_tokens")
@Getter @Setter @NoArgsConstructor
public class EmailVerificationToken {

    @Id
    @UuidGenerator
    private UUID id; // 主键，自动生成 UUID

    @Column(name="user_id", nullable=false)
    private UUID userId; // 关联的用户 ID

    @Column(nullable=false, unique=true)
    private String token; // 唯一的验证口令（随机生成）

    @Column(name="expires_at", nullable=false)
    private Instant expiresAt; // 过期时间（如 24 小时后）

    @Column(name="used_at")
    private Instant usedAt; // 实际使用时间（验证通过时记录）

    @Column(name="created_at", nullable=false)
    private Instant createdAt = Instant.now(); // 创建时间（默认当前）

    // 判断是否过期
    public boolean isExpired(){ return Instant.now().isAfter(expiresAt); }

    // 判断是否已使用
    public boolean isUsed(){ return usedAt != null; }
}
