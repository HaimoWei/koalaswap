package com.koalaswap.user.repository;

import com.koalaswap.user.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * 忘记密码令牌仓库：
 * - 按 tokenHash 查找（库里只存哈希）
 * - 安全地将令牌标记为已使用（并发下只允许第一次成功）
 * - 清理过期/已使用令牌
 */
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    /**
     * 按哈希精确查找令牌。
     * 注意：入库存的是 sha256(plainToken)，这里查的也是哈希。
     */
    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    /**
     * 将令牌标记为已使用（并写入 usedAt）。
     * 额外增加并发保护条件：仅当令牌“未使用且未过期”时才会更新成功。
     * 返回值为受影响行数：1=成功，0=失败（例如已被使用或已过期）。
     *
     * 建议在 Service 层的 @Transactional 方法中调用，并检查返回值是否为 1。
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
           update PasswordResetToken t
              set t.used = true, t.usedAt = :now
            where t.tokenId = :id
              and t.used = false
              and t.expiresAt > :now
           """)
    int markUsedSafely(@Param("id") UUID id, @Param("now") Instant now);

    /**
     * 清理过期或已使用的令牌。
     * 可在重置成功后顺手调用，或由定时任务周期性调用。
     */
    @Modifying
    @Query("delete from PasswordResetToken t where t.expiresAt < :now or t.used = true")
    int deleteExpired(@Param("now") Instant now);
}
