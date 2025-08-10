package com.koalaswap.user.service;

import com.koalaswap.user.entity.User;
import com.koalaswap.user.mail.MailService;
import com.koalaswap.user.repository.UserRepository;
import com.koalaswap.user.entity.EmailVerificationToken;
import com.koalaswap.user.repository.EmailVerificationTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

/**
 * 邮箱验证的核心服务
 * 负责生成 Token、发送验证邮件、验证 Token 等
 */
@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final EmailVerificationTokenRepository tokenRepo; // Token 数据访问
    private final UserRepository userRepo;                    // 用户数据访问
    private final MailService mail;                            // 邮件发送服务

    @Value("${app.urls.verifyRedirectBase:http://localhost:5173/verified}")
    private String verifyRedirectBase; // 邮箱验证成功后跳转的前端页面

    @Value("${app.auth.verifyTtlSec:86400}") // Token 有效时间（秒），默认 24 小时
    private long verifyTtlSec;

    @Value("${app.auth.resendCooldownSec:60}") // 重发冷却时间（秒），默认 1 分钟
    private long resendCooldownSec;

    private static final SecureRandom RNG = new SecureRandom();

    // 生成随机 Token
    private String newToken(){
        byte[] b = new byte[32];
        RNG.nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }

    /**
     * 给用户生成一个新的验证 Token 并发送邮件
     * 带有重发限流逻辑（避免短时间内重复发送）
     */
    @Transactional
    public void issueAndSend(User user){
        var now = Instant.now();

        // 检查最近一次发送时间，避免短时间重复发送
        tokenRepo.findTopByUserIdOrderByCreatedAtDesc(user.getId())
                .ifPresent(latest -> {
                    if(latest.getCreatedAt().isAfter(now.minusSeconds(resendCooldownSec))){
                        throw new IllegalArgumentException("请稍后再试，刚刚已发送验证邮件");
                    }
                });

        // 创建并保存新的 Token
        var t = new EmailVerificationToken();
        t.setUserId(user.getId());
        t.setToken(newToken());
        t.setExpiresAt(now.plusSeconds(verifyTtlSec)); // 设置过期时间
        tokenRepo.save(t);

        // 拼接验证链接
        var link = "%s?token=%s".formatted(verifyRedirectBase, t.getToken());

        // 发送验证邮件
        mail.sendPlainText(
                user.getEmail(),
                "Verify your KoalaSwap email",
                ("Hi %s,\n\nClick to verify:\n%s\n\nValid for 24h.")
                        .formatted(user.getDisplayName(), link)
        );
    }

    /**
     * 校验 Token，如果合法则标记用户邮箱为已验证
     */
    @Transactional
    public void verify(String rawToken){
        // 找到对应 Token
        String token = rawToken == null ? "" : rawToken.trim();   // ← 关键
        var t = tokenRepo.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("验证链接无效"));

        // 检查 Token 状态
        if(t.isUsed())    throw new IllegalArgumentException("验证链接已被使用");
        if(t.isExpired()) throw new IllegalArgumentException("验证链接已过期");

        // 更新用户邮箱状态
        var user = userRepo.findById(t.getUserId()).orElseThrow();
        user.setEmailVerified(true);
        userRepo.save(user);

        // 记录 Token 使用时间
        t.setUsedAt(Instant.now());
        tokenRepo.save(t);
    }
}
