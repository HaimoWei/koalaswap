-- =====================================================================
-- KoalaSwap Schema v1.7 - 商品“包邮”开关
-- 目标：为 products 表新增 free_shipping 字段（是否包邮）
-- 执行前提：已执行 v1.2 + v1.3_extra 等之前的脚本
-- PostgreSQL >= 13
-- =====================================================================

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN products.free_shipping IS '是否包邮（卖家承担运费）';

-- 说明：
-- 1) 默认值为 FALSE，历史数据无需额外回填。
-- 2) 前端发布/编辑时将通过布尔开关选择是否包邮；后端/实体字段名 freeShipping。

