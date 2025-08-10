package com.koalaswap.user.service;

import com.koalaswap.user.entity.PasswordResetToken;
import com.koalaswap.user.mail.MailService;
import com.koalaswap.user.repository.PasswordResetTokenRepository;
import com.koalaswap.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

/**
 * 忘记密码核心服务（直接使用你现有的 MailService 发邮件）
 *
 * 设计要点：
 * 1) 生成一次性明文 token（仅通过邮件发送），数据库仅存 sha256(plain) 的哈希，避免泄露风险。
 * 2) token 短期有效（默认 30 分钟），且仅能使用一次（并发保护在仓库层 markUsedSafely）。
 * 3) 防枚举：无论邮箱是否存在，/forgot-password 都返回 200。
 */
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final UserRepository userRepo;
    private final PasswordResetTokenRepository tokenRepo;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService; // ← 直接使用你已有的邮件服务

    /** 前端重置页 URL 前缀（例如 http://localhost:5173） */
    @Value("${app.reset.frontendUrl:http://localhost:5173}")
    private String frontendUrl;

    /** 令牌有效期（分钟） */
    @Value("${app.reset.ttlMinutes:30}")
    private long ttlMinutes;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    /**
     * 发起重置请求：如果邮箱存在就生成令牌并发送邮件；否则静默返回。
     * 始终 200，避免被用来枚举已注册邮箱。
     */
    @Transactional
    public void requestReset(String emailRaw) {
        if (emailRaw == null || emailRaw.isBlank()) return;
        final String email = emailRaw.trim(); // 你的 UserRepository 是 findByEmail（非忽略大小写），按现状保持一致

        userRepo.findByEmail(email).ifPresent(user -> {
            // 1) 生成一次性明文 token（URL-safe，无填充，强随机）
            String plain = randomToken();

            // 2) 数据库只存哈希（sha256 十六进制字符串）
            String hash = sha256Hex(plain);

            var t = new PasswordResetToken();
            t.setUserId(user.getId());
            t.setTokenHash(hash);
            t.setExpiresAt(Instant.now().plus(Duration.ofMinutes(ttlMinutes)));
            tokenRepo.save(t);

            // 3) 拼重置链接并发送邮件
            String link = frontendUrl + "/reset?token=" + plain;
            String subject = "Reset your KoalaSwap password";
            String body = """
                    We received a request to reset your KoalaSwap password.
                    If this was you, click the link below within %d minutes:
                    %s

                    If you didn't request this, you can ignore this email.
                    """.formatted(ttlMinutes, link);

            // 直接调用你现有的邮件服务
            mailService.sendPlainText(user.getEmail(), subject, body);
        });
    }

    /**
     * 前端重置页加载前的简验：仅返回 true/false，不暴露具体失败原因。
     */
    @Transactional(readOnly = true)
    public boolean isTokenUsable(String plainToken) {
        return findUsableToken(plainToken).isPresent();
    }

    /**
     * 提交新密码：校验令牌有效性 -> 更新用户密码 -> 标记令牌已用 -> （可选）清理过期令牌
     */
    @Transactional
    public void resetPassword(String plainToken, String newPassword) {
        if (plainToken == null || plainToken.isBlank()) {
            throw new IllegalArgumentException("INVALID_TOKEN");
        }
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("WEAK_PASSWORD");
        }

        var token = findUsableToken(plainToken)
                .orElseThrow(() -> new IllegalArgumentException("INVALID_TOKEN"));

        var user = userRepo.findById(token.getUserId())
                .orElseThrow(() -> new IllegalStateException("USER_NOT_FOUND"));

        // 1) 更新密码（这里不依赖实体上一定存在 passwordUpdatedAt 字段，避免与你当前实体不一致）
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setPasswordUpdatedAt(Instant.now());
        userRepo.save(user);

        // 2) 并发保护地标记令牌为已用（仅第一次成功；否则当作无效）
        int updated = tokenRepo.markUsedSafely(token.getTokenId(), Instant.now());
        if (updated != 1) {
            throw new IllegalArgumentException("INVALID_TOKEN");
        }

        // 3) 可选：顺手清理过期/已用
        tokenRepo.deleteExpired(Instant.now());
    }

    // ======== 内部小工具 ========

    private Optional<PasswordResetToken> findUsableToken(String plainToken) {
        String hash = sha256Hex(plainToken);
        var now = Instant.now();
        return tokenRepo.findByTokenHash(hash)
                .filter(t -> !t.isUsed() && t.getExpiresAt().isAfter(now));
    }

    /** 生成 URL 安全、无填充的一次性令牌（~64 字符） */
    private static String randomToken() {
        byte[] buf = new byte[48];         // 384 bits
        SECURE_RANDOM.nextBytes(buf);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
    }

    /** 计算字符串的 sha256 十六进制摘要（不依赖第三方库） */
    private static String sha256Hex(String s) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] out = md.digest(s.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(out.length * 2);
            for (byte b : out) {
                sb.append(Character.forDigit((b >>> 4) & 0xF, 16));
                sb.append(Character.forDigit(b & 0xF, 16));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
