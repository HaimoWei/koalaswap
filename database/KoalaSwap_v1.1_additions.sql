-- =====================================================================
-- KoalaSwap Additional Indexes & Constraints for Orders (v1.1 compatible)
-- Filename: KoalaSwap_v1.1_additions.sql
-- Purpose : Improve performance & enforce 'one active order per product'
-- =====================================================================

-- 1) Listing performance
CREATE INDEX IF NOT EXISTS idx_orders_buyer_created
  ON orders(buyer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_seller_created
  ON orders(seller_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status_created
  ON orders(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_product
  ON orders(product_id);

-- 2) Business constraint: only one 'open' order per product
--    Open statuses: PENDING, PAID, SHIPPED
CREATE UNIQUE INDEX IF NOT EXISTS ux_orders_open_unique_product
  ON orders(product_id)
  WHERE status IN ('PENDING','PAID','SHIPPED');

ALTER TABLE orders
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;


-- =========================
-- KoalaSwap v1.2 - Reviews
-- =========================

-- 1) 扩展首评表：匿名 & 角色 & 更新时间
ALTER TABLE order_reviews
    ADD COLUMN IF NOT EXISTS reviewer_role VARCHAR(10) NOT NULL DEFAULT 'BUYER',
    ADD COLUMN IF NOT EXISTS is_anonymous  BOOLEAN     NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMP   NOT NULL DEFAULT NOW();

-- 触发器 fn_update_user_rating 已存在，继续生效（rating 仍仅来自首评）

-- 2) 待评价槽位枚举 & 表
DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_slot_status') THEN
            CREATE TYPE review_slot_status AS ENUM ('PENDING','REVIEWED','EXPIRED');
        END IF;
    END $$;

CREATE TABLE IF NOT EXISTS review_slots (
                                            id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                            order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                                            product_id    UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
                                            reviewer_id   UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
                                            reviewee_id   UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
                                            reviewer_role VARCHAR(10) NOT NULL,                 -- BUYER/SELLER
                                            status        review_slot_status NOT NULL DEFAULT 'PENDING',
                                            due_at        TIMESTAMP,
                                            created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
                                            UNIQUE (order_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_review_slots_reviewer_status ON review_slots(reviewer_id, status);
CREATE INDEX IF NOT EXISTS idx_review_slots_role_status     ON review_slots(reviewer_id, reviewer_role, status);

-- 3) 追评表（不改分）
CREATE TABLE IF NOT EXISTS order_review_appends (
                                                    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                                    review_id  UUID NOT NULL REFERENCES order_reviews(id) ON DELETE CASCADE,
                                                    comment    TEXT NOT NULL,
                                                    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_appends_review_time ON order_review_appends(review_id, created_at DESC);

