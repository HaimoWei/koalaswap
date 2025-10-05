-- =====================================================================
-- KoalaSwap Schema v1.5 - 用户地址管理
-- 目标：添加用户收货地址管理功能
-- 执行前提：需要先执行 v1.2 + v1.3_extra 等之前的迁移脚本
-- PostgreSQL >= 13
-- =====================================================================

-- 确保依赖扩展存在
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 用户收货地址表
CREATE TABLE IF NOT EXISTS user_addresses (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_name       VARCHAR(100) NOT NULL,           -- 收件人姓名
    phone               VARCHAR(20) NOT NULL,            -- 收件人电话
    province            VARCHAR(50) NOT NULL,            -- 省份
    city                VARCHAR(50) NOT NULL,            -- 城市
    district            VARCHAR(50) NOT NULL,            -- 区/县
    detail_address      TEXT NOT NULL,                   -- 详细地址（街道、门牌号等）
    postal_code         VARCHAR(10),                     -- 邮政编码（可选）
    is_default          BOOLEAN NOT NULL DEFAULT FALSE,  -- 是否为默认地址
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 索引：按用户查询地址列表（最常用）
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id
    ON user_addresses(user_id, created_at DESC);

-- 索引：快速查找用户的默认地址
CREATE INDEX IF NOT EXISTS idx_user_addresses_default
    ON user_addresses(user_id, is_default)
    WHERE is_default = TRUE;

-- 更新时间戳触发器（沿用 v1.2 的通用函数）
DROP TRIGGER IF EXISTS trg_touch_user_addresses_updated_at ON user_addresses;
CREATE TRIGGER trg_touch_user_addresses_updated_at
    BEFORE UPDATE ON user_addresses
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

-- 业务约束：确保每个用户最多只有一个默认地址的函数
CREATE OR REPLACE FUNCTION fn_ensure_single_default_address() RETURNS TRIGGER AS $$
BEGIN
    -- 如果新设置的记录为默认地址，则将该用户的其他地址设为非默认
    IF NEW.is_default = TRUE THEN
        UPDATE user_addresses
        SET is_default = FALSE, updated_at = NOW()
        WHERE user_id = NEW.user_id
          AND id <> NEW.id
          AND is_default = TRUE;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 应用默认地址约束触发器
DROP TRIGGER IF EXISTS trg_ensure_single_default_address ON user_addresses;
CREATE TRIGGER trg_ensure_single_default_address
    BEFORE INSERT OR UPDATE OF is_default ON user_addresses
    FOR EACH ROW EXECUTE FUNCTION fn_ensure_single_default_address();

-- 数据验证约束
ALTER TABLE user_addresses
    ADD CONSTRAINT chk_phone_format
        CHECK (phone ~ '^[0-9+\-\s\(\)]{10,20}$'),  -- 基本电话号码格式检查
    ADD CONSTRAINT chk_receiver_name_length
        CHECK (char_length(trim(receiver_name)) >= 2),  -- 收件人姓名至少2个字符
    ADD CONSTRAINT chk_detail_address_length
        CHECK (char_length(trim(detail_address)) >= 5);  -- 详细地址至少5个字符

-- =====================================================================
-- 说明：
-- 1. 使用UUID主键保持与其他表一致
-- 2. 外键关联到users表，级联删除用户时清理地址
-- 3. is_default字段通过触发器确保每用户只有一个默认地址
-- 4. 添加基本的数据验证约束
-- 5. 索引优化常见查询场景
-- 6. 沿用项目现有的时间戳更新机制
-- =====================================================================

