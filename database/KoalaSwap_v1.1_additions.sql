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
