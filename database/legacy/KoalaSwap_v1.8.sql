-- =====================================================================
-- KoalaSwap Schema v1.8 - 创建系统账户并支持系统消息
-- 目标：创建专门的系统用户账户，用于发送订单状态等系统消息
-- 执行前提：需要先执行之前的所有迁移脚本
-- PostgreSQL >= 13
-- =====================================================================

-- 确保依赖扩展存在
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 插入系统用户账户（像大厂一样的专业做法）
INSERT INTO users (
    id,
    email,
    password_hash,
    display_name,
    avatar_url,
    bio,
    email_verified,
    rating_avg,
    rating_count,
    token_version,
    phone_verified,
    created_at,
    password_updated_at,
    last_active_at,
    member_since
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,  -- 特殊的系统用户ID
    'system@koalaswap.com',                         -- 系统邮箱
    '$2a$10$dummyHashForSystemUserNotUsedForLogin', -- BCrypt格式的占位密码哈希（永不用于登录）
    '系统消息',                                      -- 显示名称
    '/assets/avatars/system-avatar.png',            -- 系统头像
    '自动发送订单状态、通知等系统消息',                -- 个人简介
    true,                                           -- 邮箱已验证
    0.0,                                            -- 评分平均值
    0,                                              -- 评分次数
    1,                                              -- 令牌版本
    false,                                          -- 手机未验证
    NOW(),                                          -- 创建时间
    NOW(),                                          -- 密码更新时间
    NOW(),                                          -- 最后活跃时间
    CURRENT_DATE                                    -- 会员日期
) ON CONFLICT (id) DO NOTHING;  -- 如果已存在则忽略

-- 确认插入结果
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE id = '00000000-0000-0000-0000-000000000001') THEN
        RAISE NOTICE '✅ 系统用户账户创建成功: system@koalaswap.com';
    ELSE
        RAISE EXCEPTION '❌ 系统用户账户创建失败';
    END IF;
END $$;

-- =====================================================================
-- 说明：
-- 1. 创建专门的系统用户账户，ID为 00000000-0000-0000-0000-000000000001
-- 2. 所有系统消息将使用这个用户ID作为sender_id，而不是null
-- 3. 保持数据一致性，sender_id字段永远不为空
-- 4. 系统账户使用占位密码，不能用于正常登录
-- 5. 这是大厂标准做法，更加专业和可扩展
-- =====================================================================

-- Migration to add review system events to the system_event enum
-- This allows chat-service to properly handle review completion events

-- Add new enum values for review events
ALTER TYPE system_event ADD VALUE IF NOT EXISTS 'BUYER_REVIEWED';
ALTER TYPE system_event ADD VALUE IF NOT EXISTS 'SELLER_REVIEWED';

-- Note: These will be used when:
-- - BUYER_REVIEWED: When a buyer completes their review of the seller
-- - SELLER_REVIEWED: When a seller completes their review of the buyer

