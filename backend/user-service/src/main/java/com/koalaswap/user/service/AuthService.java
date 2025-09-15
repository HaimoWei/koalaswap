// backend/user-service/src/main/java/com/koalaswap/user/service/AuthService.java
package com.koalaswap.user.service;

import com.koalaswap.user.dto.LoginReq;
import com.koalaswap.user.dto.LoginRes;
import com.koalaswap.user.dto.MyProfileRes;
import com.koalaswap.user.dto.RegisterReq;
import com.koalaswap.user.entity.EmailVerificationToken;
import com.koalaswap.user.entity.User;
import com.koalaswap.user.mail.MailService;
import com.koalaswap.user.repository.EmailVerificationTokenRepository;
import com.koalaswap.user.repository.UserRepository;
import com.koalaswap.common.security.JwtService;
import com.koalaswap.user.events.PvBumpedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.ApplicationEventPublisher;


import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;


/**
 * 【认证领域服务 AuthService】
 * 负责注册/登录等与用户身份相关的业务逻辑：
 *  - 注册：唯一邮箱校验 -> 密码加密 -> 保存用户 -> 返回“我的资料视图”
 *  - 登录：邮箱存在校验 -> 密码匹配 -> 返回“我的资料视图”
 *
 * 说明：
 *  - 不做 HTTP/JSON 相关的事（那是 Controller 的职责）
 *  - 不直接面向数据库 SQL（通过 Repository 抽象访问）
 *  - 仅返回“对外的安全 DTO”，不直接返回 Entity
 *
 * 依赖：
 *  - UserRepository：数据访问
 *  - PasswordEncoder：密码哈希（在 SecurityConfig 中声明 BCryptPasswordEncoder Bean）
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository repo;
    private final PasswordEncoder encoder;
    private final EmailVerificationTokenRepository emailVerificationTokenRepo;
    private final MailService mailService;
    private final EmailVerificationService verificationService;
    private final JwtService jwtService; // 构造注入
    // 发布领域事件（用于事务提交后写 Redis + 发布消息）
    private final ApplicationEventPublisher events;

    @Value("${app.urls.verify-redirect-base}")
    private String verifyRedirectBase;
    @Value("${app.user.default-avatar-url:/assets/avatars/default-avatar.svg}")
    private String defaultAvatarUrl;
    /**
     * 用户注册
     * @param req 前端提交的注册请求（已通过 @Valid 校验基本格式）
     * @return MyProfileRes “我的资料视图”（适合注册成功后直接展示在前端）
     *
     * 流程：
     *  1) 唯一性校验：邮箱是否被占用
     *  2) 密码加密：使用 BCrypt（不可逆哈希），永不存明文
     *  3) 持久化：保存到 users 表
     *  4) 映射：Entity -> MyProfileRes（只返回可对外展示的字段）
     *
     * 异常处理：
     *  - 如果邮箱已存在，抛 IllegalArgumentException
     *  - GlobalExceptionHandler 会把它转换为统一 ApiResponse 错误返回
     */
    public MyProfileRes register(RegisterReq req){
        // 1) 唯一邮箱校验
        if (repo.existsByEmail(req.email())) {
            throw new IllegalArgumentException("该邮箱已注册");
        }

        // 2) 组装实体（只在服务层做）并加密密码
        User u = new User();
        u.setEmail(req.email());
        u.setPasswordHash(encoder.encode(req.password())); // 永远只存哈希
        u.setDisplayName(req.displayName());

        // 3) 保存到数据库（JPA -> INSERT）
        u = repo.save(u);

        // 生成 token
        var token = UUID.randomUUID().toString();
        var entity = new EmailVerificationToken();
        entity.setUserId(u.getId());
        entity.setToken(token);
        entity.setExpiresAt(Instant.now().plus(1, ChronoUnit.DAYS));
        emailVerificationTokenRepo.save(entity);

        // 拼接验证链接
        var link = verifyRedirectBase + "?token=" + token;

        // 发邮件
        mailService.sendPlainText(u.getEmail(),
                "请验证你的邮箱",
                "点击以下链接完成验证: " + link);

        // 4) 转换成“我的资料”视图返回
        return toMyProfile(u);
    }

    /**
     * 用户登录
     * @param req 登录请求（邮箱+密码）
     * @return MyProfileRes（下一步会改为：返回 { accessToken, profile }）
     *
     * 流程：
     *  1) 根据邮箱查用户
     *  2) 校验密码（明文 vs 哈希）
     *  3) 返回 MyProfileRes
     */
    public LoginRes login(LoginReq req){
        // 1) 根据邮箱查用户（不存在也给“账号或密码错误”，避免暴露账号存在性）
        var u = repo.findByEmail(req.email())
                .orElseThrow(() -> new IllegalArgumentException("账号或密码错误"));

        // 2) 先校验密码（BCrypt 会处理盐）
        if (!encoder.matches(req.password(), u.getPasswordHash())) {
            throw new IllegalArgumentException("账号或密码错误");
        }

        // 3) 邮箱未验证 → 自动重发验证邮件（带冷却）+ 返回可识别的错误码
        if (!u.isEmailVerified()) {
            try {
                verificationService.issueAndSend(u); // 你已经实现了冷却
            } catch (IllegalArgumentException ignore) {
                // 如果刚发过触发冷却，这里静默忽略，不影响提示
            }
            // 建议用固定错误码，前端好判断
            throw new IllegalArgumentException("EMAIL_NOT_VERIFIED");
            // 也可以保留中文提示，但前端要根据 message 文本判断就没那么稳
        }

        int tokenVersion = repo.findTokenVersionById(u.getId()).orElse(1);
        String token = jwtService.generateAccessToken(u.getId(), u.getEmail(), tokenVersion);
        return new LoginRes(token, toMyProfile(u));
    }

    @Transactional
    public void logoutAll(UUID userId) {
        int n = repo.bumpTokenVersion(userId);
        if (n == 0) throw new IllegalArgumentException("用户不存在");
        // 事务提交后发布事件 → 由监听器写 Redis 并 Pub/Sub
        events.publishEvent(new PvBumpedEvent(userId));
    }

    /**
     * 修改密码（需要登录）
     * @param userId 当前登录用户ID
     * @param currentPassword 当前密码
     * @param newPassword 新密码
     */
    @Transactional
    public void changePassword(UUID userId, String currentPassword, String newPassword) {
        // 1) 查找用户
        User user = repo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));

        // 2) 验证当前密码
        if (!encoder.matches(currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("当前密码错误");
        }

        // 3) 更新密码
        user.setPasswordHash(encoder.encode(newPassword));
        repo.save(user);

        // 4) 可选：修改密码后让所有token失效，强制重新登录
        repo.bumpTokenVersion(userId);
        events.publishEvent(new PvBumpedEvent(userId));
    }


    // ============ 私有辅助方法：实体 -> 对外视图 DTO 映射 ============

    private MyProfileRes toMyProfile(User u){
        // ratingAvg 在实体中是 BigDecimal（映射 NUMERIC），给前端用 Double 更友好
        String avatarResolved = (u.getAvatarUrl() == null || u.getAvatarUrl().isBlank())
                ? defaultAvatarUrl
                : u.getAvatarUrl();
        double avg = (u.getRatingAvg() == null) ? 0d : u.getRatingAvg().doubleValue();
        int    cnt = u.getRatingCount();              // 基本类型一定非空
        return new MyProfileRes(
                u.getId(),
                u.getEmail(),
                u.getDisplayName(),
                avatarResolved,
                u.getBio(),
                u.getLocation(),
                u.isPhoneVerified(),
                u.isEmailVerified(),
                avg,
                cnt,
                u.getMemberSince(),
                u.getLastActiveAt(),
                u.getCreatedAt()
        );
    }
}
