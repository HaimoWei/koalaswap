-- =====================================================================
-- KoalaSwap Schema v1.6 - 订单地址支持
-- 目标：为订单添加收货地址信息支持
-- 执行前提：需要先执行 v1.5（用户地址管理）等之前的迁移脚本
-- PostgreSQL >= 13
-- =====================================================================

-- 确保依赖扩展存在
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 为订单表添加地址相关字段
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS shipping_address_id  UUID REFERENCES user_addresses(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS shipping_address_snapshot JSONB;  -- 地址快照，防止地址被删除后订单信息丢失

-- 创建地址快照更新触发器函数
CREATE OR REPLACE FUNCTION fn_update_shipping_address_snapshot() RETURNS TRIGGER AS $$
BEGIN
    -- 如果设置了shipping_address_id，自动创建地址快照
    IF NEW.shipping_address_id IS NOT NULL AND NEW.shipping_address_id IS DISTINCT FROM OLD.shipping_address_id THEN
        SELECT jsonb_build_object(
            'id', ua.id,
            'receiverName', ua.receiver_name,
            'phone', ua.phone,
            'province', ua.province,
            'city', ua.city,
            'district', ua.district,
            'detailAddress', ua.detail_address,
            'postalCode', ua.postal_code,
            'isDefault', ua.is_default,
            'snapshotAt', NOW()
        )
        INTO NEW.shipping_address_snapshot
        FROM user_addresses ua
        WHERE ua.id = NEW.shipping_address_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 应用地址快照触发器
DROP TRIGGER IF EXISTS trg_update_shipping_address_snapshot ON orders;
CREATE TRIGGER trg_update_shipping_address_snapshot
    BEFORE INSERT OR UPDATE OF shipping_address_id ON orders
    FOR EACH ROW EXECUTE FUNCTION fn_update_shipping_address_snapshot();

-- 索引优化：按地址查询订单
CREATE INDEX IF NOT EXISTS idx_orders_shipping_address_id
    ON orders(shipping_address_id)
    WHERE shipping_address_id IS NOT NULL;

-- 添加一些有用的注释
COMMENT ON COLUMN orders.shipping_address_id IS '收货地址ID（外键到user_addresses表）';
COMMENT ON COLUMN orders.shipping_address_snapshot IS '地址信息快照，防止地址被删除后订单信息丢失';

-- =====================================================================
-- 说明：
-- 1. shipping_address_id: 外键关联到用户地址表，支持地址被删除后订单依然有效
-- 2. shipping_address_snapshot: JSONB格式存储地址快照，确保历史订单信息完整
-- 3. 触发器自动维护地址快照，无需应用层手动处理
-- 4. 索引优化地址相关查询性能
-- 5. 兼容现有订单数据（新字段可为NULL）
-- =====================================================================


ALTER TABLE users ADD COLUMN location VARCHAR(100);           -- 地理位置（显示城市）
ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE; -- 手机验证状态
ALTER TABLE users ADD COLUMN last_active_at TIMESTAMP DEFAULT NOW(); -- 最后活跃时间
ALTER TABLE users ADD COLUMN member_since DATE;              -- 会员加入日期（注册年月）

