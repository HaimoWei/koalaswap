-- 快速邮箱验证脚本 - 适用于数据导入演示
-- 简单直接，批量设置所有今天导入的用户为已验证状态

BEGIN;

-- 更新今天创建的所有用户为邮箱已验证
UPDATE users
SET email_verified = true, updated_at = NOW()
WHERE email_verified = false
  AND created_at >= CURRENT_DATE;

-- 显示更新结果
SELECT
    '更新完成' as 状态,
    COUNT(*) as 已验证用户数量
FROM users
WHERE email_verified = true
  AND created_at >= CURRENT_DATE;

COMMIT;