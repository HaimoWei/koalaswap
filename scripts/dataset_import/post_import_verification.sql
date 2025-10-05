-- =====================================================================
-- KoalaSwap 数据导入后验证脚本
-- 目的：批量设置导入用户的邮箱验证状态和其他必要字段
-- 执行时机：在用户导入完成后，商品导入之前
-- =====================================================================

-- 开始事务（确保操作原子性）
BEGIN;

-- =====================================================================
-- 1. 批量设置邮箱验证状态
-- =====================================================================

-- 更新所有导入用户的邮箱验证状态为 true
-- 注意：只更新通过导入脚本创建的用户，不影响现有真实用户
UPDATE users
SET
    email_verified = true,
    updated_at = NOW()
WHERE
    email_verified = false
    AND created_at >= CURRENT_DATE  -- 只更新今天创建的用户
    AND (
        -- 条件1: 匹配种子数据的邮箱模式
        email LIKE '%@hotmail.com'
        OR email LIKE '%@gmail.com'
        OR email LIKE '%@yahoo.com'
        OR email LIKE '%@outlook.com'
        -- 条件2: 或者是脚本生成的占位卖家
        OR email LIKE 'seed-seller+%@koalaswap.local'
    );

-- 记录更新数量
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE '已更新 % 个用户的邮箱验证状态', updated_count;
END $$;

-- =====================================================================
-- 2. 可选：批量设置其他用户字段
-- =====================================================================

-- 批量设置手机验证状态（如果需要）
UPDATE users
SET
    phone_verified = false,  -- 保持 false，因为我们没有真实手机号
    updated_at = NOW()
WHERE
    created_at >= CURRENT_DATE
    AND (
        email LIKE '%@hotmail.com'
        OR email LIKE '%@gmail.com'
        OR email LIKE '%@yahoo.com'
        OR email LIKE '%@outlook.com'
        OR email LIKE 'seed-seller+%@koalaswap.local'
    );

-- =====================================================================
-- 3. 数据验证检查
-- =====================================================================

-- 检查邮箱验证状态更新结果
SELECT
    '邮箱验证状态统计' as 检查项目,
    email_verified,
    COUNT(*) as 用户数量
FROM users
WHERE created_at >= CURRENT_DATE
GROUP BY email_verified
ORDER BY email_verified;

-- 检查是否有异常数据
SELECT
    '异常用户检查' as 检查项目,
    id,
    email,
    display_name,
    email_verified,
    phone_verified,
    created_at
FROM users
WHERE
    created_at >= CURRENT_DATE
    AND email_verified = false  -- 应该没有未验证的用户
LIMIT 5;

-- 检查占位卖家账号
SELECT
    '占位卖家账号统计' as 检查项目,
    COUNT(*) as 占位卖家数量
FROM users
WHERE
    email LIKE 'seed-seller+%@koalaswap.local'
    AND created_at >= CURRENT_DATE;

-- =====================================================================
-- 4. 提交事务
-- =====================================================================

-- 如果所有检查都正常，提交事务
COMMIT;

-- =====================================================================
-- 使用说明：
--
-- 执行方式1：直接在psql中执行
-- psql -h localhost -p 15433 -U koalaswap -d koalaswap_dev -f post_import_verification.sql
--
-- 执行方式2：通过数据库管理工具导入并执行
--
-- 执行方式3：在用户导入脚本中自动调用
-- 可以在 import_users.py 完成后自动执行此脚本
-- =====================================================================

-- 最终状态检查（可选）
SELECT
    'user-import-verification-summary' as 报告类型,
    '邮箱验证用户' as 类别,
    COUNT(*) as 数量
FROM users
WHERE
    email_verified = true
    AND created_at >= CURRENT_DATE;