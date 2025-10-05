-- =====================================================================
-- KoalaSwap Schema v2.0 (Consolidated)
-- 目的：将 database 目录下现有的 v1.2、v1.3_extra、v1.4、v1.5、v1.6、v1.7、v1.8、category_init_data
--       全部合并为单一脚本（相近功能归组），执行后效果与原有脚本按顺序全部执行完全一致。
-- 说明：
--  - 本脚本可以在全新数据库上直接执行，构建出完整最新结构与初始数据。
--  - 为确保兼容性，大量语句保留了 IF NOT EXISTS / IF EXISTS 防御式写法，与原脚本保持一致。
--  - 分组结构如下：
--      1) 基础 Schema（源自 v1.2，保持原样）
--      2) 用户相关追加（v1.6 用户字段；v1.8 系统用户）
--      3) 商品相关（v1.3 状态机；v1.7 包邮）
--      4) 商品图片（v1.3 一处列属性；v1.4 全量图片云存储迁移）
--      5) 聊天相关（v1.3 聊天升级；v1.8 system_event 枚举追加）
--      6) 订单与地址（v1.5 用户地址；v1.6 订单地址与快照）
--      7) 分类初始化数据（category_init_data）
-- =====================================================================

-- =====================================================================
-- 1) 基础 Schema（原样保留，自 v1.2）
-- =====================================================================
-- 以下内容完整拷贝自 database/KoalaSwap_Schema_v1.2.sql（不改动）

-- =====================================================================
-- KoalaSwap Schema v1.2 (tidy, functionally identical to merged v1.1 + additions)
--  NOTE: Object names, DDL order, and behavior are preserved exactly.
--          Only comments/formatting were improved for readability.
--          Safe to use as a drop-in replacement for the existing combined script.
-- Sources merged originally: KoalaSwap_Schema_v1.1.sql, KoalaSwap_v1.1_additions.sql
-- PostgreSQL >= 13
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ENUM -------------------------------------------------------------------
DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_condition') THEN
            CREATE TYPE product_condition AS ENUM ('NEW','LIKE_NEW','GOOD','FAIR','POOR');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
            CREATE TYPE order_status AS ENUM ('PENDING','PAID','SHIPPED','COMPLETED','CANCELLED');
        END IF;
    END $$;

-- 通用函数：自动更新时间戳 -------------------------------------------------
CREATE OR REPLACE FUNCTION fn_touch_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 用户 -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
                                     id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                     email               VARCHAR(320) UNIQUE NOT NULL,
                                     password_hash       TEXT NOT NULL,
                                     display_name        VARCHAR(120) NOT NULL,
                                     avatar_url          TEXT,
                                     bio                 TEXT,
                                     email_verified      BOOLEAN NOT NULL DEFAULT FALSE,
                                     rating_avg          NUMERIC(2,1) NOT NULL DEFAULT 0,
                                     rating_count        INT NOT NULL DEFAULT 0,
    -- 为“改密后旧 token 失效”保留：
                                     token_version       INT NOT NULL DEFAULT 1,
                                     password_updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
                                     created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
                                     updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_touch_users_updated_at ON users;

CREATE TRIGGER trg_touch_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

CREATE OR REPLACE FUNCTION fn_bump_token_version_on_password() RETURNS trigger AS $$
BEGIN
    IF NEW.password_hash IS DISTINCT FROM OLD.password_hash THEN
        NEW.password_updated_at := NOW();
        NEW.token_version := COALESCE(OLD.token_version, 1) + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bump_token_version_user ON users;

CREATE TRIGGER trg_bump_token_version_user
    BEFORE UPDATE OF password_hash ON users
    FOR EACH ROW EXECUTE FUNCTION fn_bump_token_version_on_password();

-- 商品分类 ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_categories (
                                                  id        SERIAL PRIMARY KEY,
                                                  name      VARCHAR(120) UNIQUE NOT NULL,
                                                  parent_id INT REFERENCES product_categories(id) ON DELETE SET NULL
);

-- 商品 -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
                                        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                        seller_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                        title         VARCHAR(200) NOT NULL,
                                        description   TEXT,
                                        price         NUMERIC(10,2) NOT NULL CHECK (price >= 0),
                                        currency      VARCHAR(10) NOT NULL DEFAULT 'AUD',
                                        category_id   INT REFERENCES product_categories(id),
                                        condition     product_condition NOT NULL DEFAULT 'GOOD',
                                        is_active     BOOLEAN NOT NULL DEFAULT TRUE,
                                        created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
                                        updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
                                        search_vector tsvector
);

DROP TRIGGER IF EXISTS trg_touch_products_updated_at ON products;

CREATE TRIGGER trg_touch_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

CREATE OR REPLACE FUNCTION products_search_trigger() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
            to_tsvector('english', coalesce(NEW.title,'') || ' ' || coalesce(NEW.description,''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_search ON products;

CREATE TRIGGER trg_products_search
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION products_search_trigger();

-- 商品图片 ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_images (
                                              id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                              product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                                              image_url   TEXT NOT NULL,
                                              sort_order  INT NOT NULL DEFAULT 0,
                                              created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
                                              CONSTRAINT uq_product_image_sort UNIQUE (product_id, sort_order)
);

-- 收藏 -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS favourites (
                                          user_id    UUID REFERENCES users(id)    ON DELETE CASCADE,
                                          product_id UUID REFERENCES products(id) ON DELETE CASCADE,
                                          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                                          PRIMARY KEY (user_id, product_id)
);

-- 订单 -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
                                      id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                      product_id     UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
                                      buyer_id       UUID NOT NULL REFERENCES users(id)    ON DELETE RESTRICT,
                                      seller_id      UUID NOT NULL REFERENCES users(id)    ON DELETE RESTRICT,
                                      price_snapshot NUMERIC(10,2) NOT NULL,
                                      status         order_status NOT NULL DEFAULT 'PENDING',
                                      created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
                                      closed_at      TIMESTAMP
);

-- 订单评价 ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_reviews (
                                             id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                             order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                                             reviewer_id  UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
                                             reviewee_id  UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
                                             rating       SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
                                             comment      TEXT,
                                             created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
                                             UNIQUE (order_id, reviewer_id)
);

CREATE OR REPLACE FUNCTION fn_update_user_rating() RETURNS trigger AS $$
BEGIN
    UPDATE users u
    SET rating_count = sub.cnt,
        rating_avg   = COALESCE(sub.avg, 0)
    FROM (
             SELECT reviewee_id,
                    COUNT(*) AS cnt,
                    ROUND(AVG(rating)::NUMERIC, 1) AS avg
             FROM order_reviews
             WHERE reviewee_id = NEW.reviewee_id
             GROUP BY reviewee_id
         ) sub
    WHERE u.id = sub.reviewee_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_user_rating ON order_reviews;

CREATE TRIGGER trg_update_user_rating
    AFTER INSERT OR UPDATE ON order_reviews
    FOR EACH ROW EXECUTE FUNCTION fn_update_user_rating();

-- 会话/消息 --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
                                             id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                             product_id UUID REFERENCES products(id) ON DELETE SET NULL,
                                             created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
                                                         conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
                                                         user_id         UUID REFERENCES users(id)         ON DELETE CASCADE,
                                                         joined_at       TIMESTAMP NOT NULL DEFAULT NOW(),
                                                         PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
                                        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
                                        sender_id       UUID NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
                                        body_text       TEXT NOT NULL,
                                        is_read         BOOLEAN NOT NULL DEFAULT FALSE,
                                        sent_at         TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ✅ 邮箱验证（老表名/老字段，与你当前代码匹配） --------------------------
CREATE TABLE IF NOT EXISTS email_verification_tokens (
                                                         id         UUID PRIMARY KEY,
                                                         user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                                         token      VARCHAR(255) NOT NULL UNIQUE,
                                                         created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                                         expires_at TIMESTAMPTZ NOT NULL,
                                                         used_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_evt_user_expires ON email_verification_tokens(user_id, expires_at);

-- ✅ 密码重置令牌：和当前代码一致（使用 token_hash）
CREATE TABLE IF NOT EXISTS password_reset_tokens (
                                                     token_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                                     user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                                     token_hash  VARCHAR(128) NOT NULL,      -- 存哈希，不存明文
                                                     expires_at  TIMESTAMPTZ NOT NULL,
                                                     used        BOOLEAN NOT NULL DEFAULT FALSE,
                                                     created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                                     used_at     TIMESTAMPTZ
);

-- 常用索引：按哈希查找、按用户/过期时间清理
CREATE UNIQUE INDEX IF NOT EXISTS ux_prt_token_hash ON password_reset_tokens(token_hash);

CREATE INDEX        IF NOT EXISTS ix_prt_user_expires ON password_reset_tokens(user_id, expires_at);

-- 索引 -------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_category_price    ON products(category_id, price);

CREATE INDEX IF NOT EXISTS idx_products_active_created_at ON products(is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_active_price      ON products(is_active, price);

CREATE INDEX IF NOT EXISTS idx_products_search            ON products USING GIN (search_vector);

CREATE INDEX IF NOT EXISTS idx_orders_buyer               ON orders(buyer_id);

CREATE INDEX IF NOT EXISTS idx_orders_seller              ON orders(seller_id);

CREATE INDEX IF NOT EXISTS idx_messages_conv_time         ON messages(conversation_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_favourites_user_time       ON favourites(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conv_participants_user     ON conversation_participants(user_id);

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

-- 1) 重命名表
ALTER TABLE IF EXISTS public.favourites RENAME TO favorites;

-- 2) （可选）如果有主键或唯一索引名里带 favourites，可按需重命名
--   下面这些名字仅作常见示例，存在才会成功；不存在会报错，可逐条执行或加 IF EXISTS
-- 主键索引（若存在）
DO $$
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'favourites_pkey') THEN
            EXECUTE 'ALTER INDEX favourites_pkey RENAME TO favorites_pkey';
        END IF;
    END$$;

-- 复合唯一约束（若你创建过）
-- 例如：favourites_user_id_product_id_key
DO $$
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'favourites_user_id_product_id_key') THEN
            EXECUTE 'ALTER INDEX favourites_user_id_product_id_key RENAME TO favorites_user_id_product_id_key';
        END IF;
    END$$;

-- 外键/检查约束名如果包含 favourites，也可以按需 rename
-- 示例（把具体旧约束名替换为实际名称后执行）：
-- ALTER TABLE favorites RENAME CONSTRAINT favourites_user_id_fkey TO favorites_user_id_fkey;


-- =====================================================================
-- 2) 用户相关追加（v1.6 字段；v1.8 系统用户）
-- =====================================================================

-- v1.6: 为 users 增加辅助字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS member_since DATE;

-- v1.8: 插入系统用户（如已存在则忽略）
CREATE EXTENSION IF NOT EXISTS pgcrypto;
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
    '00000000-0000-0000-0000-000000000001'::uuid,
    'system@koalaswap.com',
    '$2a$10$dummyHashForSystemUserNotUsedForLogin',
    '系统消息',
    '/assets/avatars/system-avatar.png',
    '自动发送订单状态、通知等系统消息',
    true,
    0.0,
    0,
    1,
    false,
    NOW(),
    NOW(),
    NOW(),
    CURRENT_DATE
) ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE id = '00000000-0000-0000-0000-000000000001') THEN
        RAISE NOTICE '✅ 系统用户账户存在: system@koalaswap.com';
    ELSE
        RAISE EXCEPTION '❌ 系统用户账户创建失败';
    END IF;
END $$;


-- =====================================================================
-- 3) 商品相关（v1.3 状态机；v1.7 包邮）
-- =====================================================================

-- v1.3: product_status 状态机 & 兼容迁移
DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_status') THEN
            CREATE TYPE product_status AS ENUM ('ACTIVE','RESERVED','SOLD','HIDDEN');
        END IF;
    END $$;

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS status product_status NOT NULL DEFAULT 'ACTIVE';

DO $$
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='products' AND column_name='is_active') THEN
            UPDATE products
            SET status = CASE WHEN is_active THEN 'ACTIVE'::product_status
                              ELSE 'HIDDEN'::product_status END;
        END IF;
    END $$;

DO $$
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='products' AND column_name='is_active') THEN
            ALTER TABLE products DROP COLUMN is_active;
        END IF;
    END $$;

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

DROP INDEX IF EXISTS public.idx_products_active_created_at;
DROP INDEX IF EXISTS public.idx_products_active_price;
ALTER TABLE public.products DROP COLUMN IF EXISTS is_active;

-- v1.7: 商品“包邮”字段
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN NOT NULL DEFAULT FALSE;
COMMENT ON COLUMN products.free_shipping IS '是否包邮（卖家承担运费）';


-- =====================================================================
-- 4) 商品图片（v1.3 一处列属性；v1.4 全量迁移）
-- =====================================================================

-- v1.3: 允许 sort_order 为空（后续由 v1.4 引入的 display_order 取代其语义）
ALTER TABLE product_images ALTER COLUMN sort_order DROP NOT NULL;

-- v1.4: Image Storage Migration（完整保留）
BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_images') THEN
        RAISE EXCEPTION 'product_images 表不存在，请先执行基础 schema 脚本';
    END IF;
    RAISE NOTICE '开始执行图片存储迁移...';
END $$;

DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO duplicate_count
    FROM (
        SELECT product_id, COALESCE(sort_order, 0) as display_val
        FROM product_images
        GROUP BY product_id, COALESCE(sort_order, 0)
        HAVING COUNT(*) > 1
    ) duplicates;

    IF duplicate_count > 0 THEN
        RAISE NOTICE '发现 % 组重复的排序数据，正在修复...', duplicate_count;

        WITH ranked_images AS (
            SELECT
                id,
                product_id,
                ROW_NUMBER() OVER (
                    PARTITION BY product_id
                    ORDER BY COALESCE(sort_order, 0), created_at
                ) - 1 as new_sort_order
            FROM product_images
        )
        UPDATE product_images
        SET sort_order = ri.new_sort_order
        FROM ranked_images ri
        WHERE product_images.id = ri.id;

        RAISE NOTICE '✅ 重复数据修复完成';
    ELSE
        RAISE NOTICE '数据检查通过，无重复排序问题';
    END IF;
END $$;

ALTER TABLE product_images
    ADD COLUMN IF NOT EXISTS object_key TEXT,
    ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS file_size BIGINT,
    ADD COLUMN IF NOT EXISTS original_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS upload_status VARCHAR(20) DEFAULT 'COMPLETED',
    ADD COLUMN IF NOT EXISTS uploaded_by UUID,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_product_images_uploaded_by'
          AND table_name = 'product_images'
    ) THEN
        ALTER TABLE product_images
            ADD CONSTRAINT fk_product_images_uploaded_by
                FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

DROP TRIGGER IF EXISTS trg_touch_product_images_updated_at ON product_images;
CREATE TRIGGER trg_touch_product_images_updated_at
    BEFORE UPDATE ON product_images
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

DO $$
BEGIN
    RAISE NOTICE '开始数据迁移...';

    WITH ranked_images AS (
        SELECT
            id,
            product_id,
            ROW_NUMBER() OVER (
                PARTITION BY product_id
                ORDER BY COALESCE(sort_order, 0), created_at
            ) - 1 as new_display_order
        FROM product_images
    )
    UPDATE product_images
    SET display_order = ri.new_display_order
    FROM ranked_images ri
    WHERE product_images.id = ri.id;

    UPDATE product_images
    SET upload_status = 'COMPLETED'
    WHERE upload_status IS NULL;

    WITH first_images AS (
        SELECT DISTINCT ON (product_id)
               id, product_id
        FROM product_images
        WHERE upload_status = 'COMPLETED'
        ORDER BY product_id, display_order, created_at
    )
    UPDATE product_images
    SET is_primary = TRUE
    WHERE id IN (SELECT id FROM first_images);

    RAISE NOTICE '数据迁移完成：display_order 已重新分配，主图已标记';
END $$;

ALTER TABLE product_images DROP CONSTRAINT IF EXISTS uq_product_image_sort;

CREATE UNIQUE INDEX IF NOT EXISTS uq_product_image_display_order
    ON product_images (product_id, display_order)
    WHERE upload_status = 'COMPLETED';

CREATE INDEX IF NOT EXISTS idx_product_images_primary
    ON product_images (product_id, is_primary)
    WHERE is_primary = TRUE AND upload_status = 'COMPLETED';

CREATE INDEX IF NOT EXISTS idx_product_images_list
    ON product_images (product_id, display_order, upload_status);

CREATE INDEX IF NOT EXISTS idx_product_images_object_key
    ON product_images (object_key)
    WHERE object_key IS NOT NULL;

CREATE OR REPLACE FUNCTION fn_maintain_primary_image() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = TRUE AND NEW.upload_status = 'COMPLETED' THEN
        UPDATE product_images
        SET is_primary = FALSE
        WHERE product_id = NEW.product_id
          AND id != NEW.id
          AND is_primary = TRUE;
    END IF;

    IF (TG_OP = 'UPDATE' AND OLD.is_primary = TRUE AND (NEW.is_primary = FALSE OR NEW.upload_status != 'COMPLETED'))
       OR (TG_OP = 'DELETE' AND OLD.is_primary = TRUE) THEN

        WITH next_primary AS (
            SELECT id
            FROM product_images
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
              AND upload_status = 'COMPLETED'
              AND id != COALESCE(NEW.id, OLD.id)
            ORDER BY display_order, created_at
            LIMIT 1
        )
        UPDATE product_images
        SET is_primary = TRUE
        WHERE id = (SELECT id FROM next_primary);
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_maintain_primary_image ON product_images;
CREATE TRIGGER trg_maintain_primary_image
    AFTER INSERT OR UPDATE OR DELETE ON product_images
    FOR EACH ROW EXECUTE FUNCTION fn_maintain_primary_image();

ALTER TABLE product_images
    ADD CONSTRAINT chk_upload_status
    CHECK (upload_status IN ('UPLOADING', 'COMPLETED', 'FAILED'));

ALTER TABLE product_images
    ADD CONSTRAINT chk_completed_must_have_url
    CHECK (upload_status != 'COMPLETED' OR (image_url IS NOT NULL AND image_url != ''));

ALTER TABLE product_images
    ADD CONSTRAINT chk_object_key_must_have_size
    CHECK (object_key IS NULL OR file_size > 0);

CREATE OR REPLACE VIEW v_product_images_complete AS
SELECT
    pi.id,
    pi.product_id,
    pi.image_url,
    pi.object_key,
    pi.is_primary,
    pi.display_order,
    pi.file_size,
    pi.original_name,
    pi.mime_type,
    pi.upload_status,
    pi.uploaded_by,
    pi.created_at,
    pi.updated_at,
    u.display_name as uploader_name
FROM product_images pi
LEFT JOIN users u ON pi.uploaded_by = u.id
WHERE pi.upload_status = 'COMPLETED'
ORDER BY pi.product_id, pi.display_order;

CREATE OR REPLACE VIEW v_product_primary_images AS
SELECT
    pi.product_id,
    pi.image_url,
    pi.object_key,
    pi.file_size,
    pi.original_name
FROM product_images pi
WHERE pi.is_primary = TRUE
  AND pi.upload_status = 'COMPLETED';

DO $$
DECLARE
    total_images INTEGER;
    total_products INTEGER;
    primary_images INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_images FROM product_images;
    SELECT COUNT(DISTINCT product_id) INTO total_products FROM product_images;
    SELECT COUNT(*) INTO primary_images FROM product_images WHERE is_primary = TRUE;

    RAISE NOTICE '';
    RAISE NOTICE '=== KoalaSwap Image Storage Migration v1.4 完成 ===';
    RAISE NOTICE '✅ 数据修复: 解决重复排序问题';
    RAISE NOTICE '✅ 新增字段: object_key, is_primary, display_order, file_size, original_name, mime_type, upload_status, uploaded_by, updated_at';
    RAISE NOTICE '✅ 新增索引: 主图索引, 显示顺序索引, S3对象键索引';
    RAISE NOTICE '✅ 新增约束: 数据完整性约束, 主图唯一性约束';
    RAISE NOTICE '✅ 新增触发器: 自动维护主图状态';
    RAISE NOTICE '✅ 新增视图: v_product_images_complete, v_product_primary_images';
    RAISE NOTICE '✅ 向后兼容: 保留原有 image_url 和 sort_order 字段';
    RAISE NOTICE '';
    RAISE NOTICE '📊 迁移统计:';
    RAISE NOTICE '   - 总图片数: %', total_images;
    RAISE NOTICE '   - 涉及商品: %', total_products;
    RAISE NOTICE '   - 主图数量: %', primary_images;
    RAISE NOTICE '';
    RAISE NOTICE '🚀 下一步: 实现后端 S3 上传 API';
END $$;

COMMIT;


-- =====================================================================
-- 5) 聊天相关（v1.3 升级；v1.8 system_event 追加）
-- =====================================================================

-- v1.3: 聊天相关枚举
CREATE EXTENSION IF NOT EXISTS pgcrypto;
DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='message_type') THEN
            CREATE TYPE message_type AS ENUM ('TEXT','IMAGE','SYSTEM');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='conversation_status') THEN
            CREATE TYPE conversation_status AS ENUM ('OPEN','FROZEN','CLOSED');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='system_event') THEN
            CREATE TYPE system_event AS ENUM ('ORDER_PLACED','PAID','SHIPPED','COMPLETED','CANCELLED');
        END IF;
    END $$;

-- v1.3: conversations 增补列/外键/索引/触发器
ALTER TABLE conversations
    ADD COLUMN IF NOT EXISTS order_id             UUID,
    ADD COLUMN IF NOT EXISTS buyer_id             UUID,
    ADD COLUMN IF NOT EXISTS seller_id            UUID,
    ADD COLUMN IF NOT EXISTS started_by           UUID,
    ADD COLUMN IF NOT EXISTS status               conversation_status DEFAULT 'OPEN',
    ADD COLUMN IF NOT EXISTS order_status_cache   order_status,
    ADD COLUMN IF NOT EXISTS product_first_image  TEXT,
    ADD COLUMN IF NOT EXISTS last_message_id      UUID,
    ADD COLUMN IF NOT EXISTS last_message_at      TIMESTAMP,
    ADD COLUMN IF NOT EXISTS last_message_preview TEXT,
    ADD COLUMN IF NOT EXISTS updated_at           TIMESTAMP NOT NULL DEFAULT NOW();

DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name='fk_conversations_order'
              AND table_name='conversations'
        ) THEN
            ALTER TABLE conversations
                ADD CONSTRAINT fk_conversations_order
                    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;
        END IF;
    END $$;

DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name='fk_conversations_buyer'
              AND table_name='conversations'
        ) THEN
            ALTER TABLE conversations
                ADD CONSTRAINT fk_conversations_buyer
                    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE RESTRICT;
        END IF;
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name='fk_conversations_seller'
              AND table_name='conversations'
        ) THEN
            ALTER TABLE conversations
                ADD CONSTRAINT fk_conversations_seller
                    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE RESTRICT;
        END IF;
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name='fk_conversations_started_by'
              AND table_name='conversations'
        ) THEN
            ALTER TABLE conversations
                ADD CONSTRAINT fk_conversations_started_by
                    FOREIGN KEY (started_by) REFERENCES users(id) ON DELETE RESTRICT;
        END IF;
    END $$;

DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name='fk_conversations_last_message'
              AND table_name='conversations'
        ) THEN
            ALTER TABLE conversations
                ADD CONSTRAINT fk_conversations_last_message
                    FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL;
        END IF;
    END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_conv_unique_triplet
    ON conversations (product_id, buyer_id, seller_id)
    WHERE buyer_id IS NOT NULL AND seller_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_buyer
    ON conversations (buyer_id, last_message_at);
CREATE INDEX IF NOT EXISTS idx_conversations_seller
    ON conversations (seller_id, last_message_at);
CREATE INDEX IF NOT EXISTS idx_conversations_updated
    ON conversations (updated_at);

DROP TRIGGER IF EXISTS trg_touch_conversations_updated_at ON conversations;
CREATE TRIGGER trg_touch_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

-- v1.3: conversation_participants 增补列/外键/索引/触发器
ALTER TABLE conversation_participants
    ADD COLUMN IF NOT EXISTS role                  TEXT CHECK (role IN ('BUYER','SELLER')),
    ADD COLUMN IF NOT EXISTS last_read_message_id  UUID,
    ADD COLUMN IF NOT EXISTS unread_count          INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_archived           BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS muted_until           TIMESTAMP,
    ADD COLUMN IF NOT EXISTS pinned_at             TIMESTAMP,
    ADD COLUMN IF NOT EXISTS deleted_at            TIMESTAMP,
    ADD COLUMN IF NOT EXISTS created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at            TIMESTAMP NOT NULL DEFAULT NOW();

DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name='fk_part_last_read'
              AND table_name='conversation_participants'
        ) THEN
            ALTER TABLE conversation_participants
                ADD CONSTRAINT fk_part_last_read
                    FOREIGN KEY (last_read_message_id) REFERENCES messages(id) ON DELETE SET NULL;
        END IF;
    END $$;

CREATE INDEX IF NOT EXISTS idx_conv_part_user
    ON conversation_participants (user_id, updated_at);

DROP TRIGGER IF EXISTS trg_touch_conv_part_updated_at ON conversation_participants;
CREATE TRIGGER trg_touch_conv_part_updated_at
    BEFORE UPDATE ON conversation_participants
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

-- v1.3: messages 增补/回填/索引与清理
ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS type          message_type NOT NULL DEFAULT 'TEXT',
    ADD COLUMN IF NOT EXISTS body          TEXT,
    ADD COLUMN IF NOT EXISTS image_url     TEXT,
    ADD COLUMN IF NOT EXISTS system_event  system_event,
    ADD COLUMN IF NOT EXISTS meta          JSONB,
    ADD COLUMN IF NOT EXISTS created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS deleted_at    TIMESTAMP;

UPDATE messages
SET body = COALESCE(body, body_text)
WHERE body IS NULL;

UPDATE messages
SET created_at = COALESCE(created_at, sent_at)
WHERE created_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_messages_conv_created_at
    ON messages (conversation_id, created_at);

BEGIN;
DROP INDEX IF EXISTS idx_messages_conv_time;
DO $$
    DECLARE
        has_created_idx BOOLEAN;
    BEGIN
        SELECT EXISTS(
            SELECT 1 FROM pg_indexes
            WHERE schemaname = ANY (current_schemas(true))
              AND indexname = 'idx_messages_conv_created_at'
        ) INTO has_created_idx;

        IF has_created_idx THEN
            EXECUTE 'ALTER INDEX idx_messages_conv_created_at RENAME TO idx_messages_conv_time';
        ELSE
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_messages_conv_time ON messages (conversation_id, created_at)';
        END IF;
    END $$;

ALTER TABLE messages
    DROP COLUMN IF EXISTS body_text,
    DROP COLUMN IF EXISTS sent_at,
    DROP COLUMN IF EXISTS is_read;
COMMIT;

ALTER TABLE conversations
    ADD CONSTRAINT chk_conversations_buyer_neq_seller
        CHECK (buyer_id IS NULL OR seller_id IS NULL OR buyer_id <> seller_id);

-- v1.8: system_event 枚举追加值
ALTER TYPE system_event ADD VALUE IF NOT EXISTS 'BUYER_REVIEWED';
ALTER TYPE system_event ADD VALUE IF NOT EXISTS 'SELLER_REVIEWED';


-- =====================================================================
-- 6) 订单与地址（v1.5 用户地址；v1.6 订单地址与快照）
-- =====================================================================

-- v1.5: 用户收货地址
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS user_addresses (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_name       VARCHAR(100) NOT NULL,
    phone               VARCHAR(20) NOT NULL,
    province            VARCHAR(50) NOT NULL,
    city                VARCHAR(50) NOT NULL,
    district            VARCHAR(50) NOT NULL,
    detail_address      TEXT NOT NULL,
    postal_code         VARCHAR(10),
    is_default          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id
    ON user_addresses(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_addresses_default
    ON user_addresses(user_id, is_default)
    WHERE is_default = TRUE;

DROP TRIGGER IF EXISTS trg_touch_user_addresses_updated_at ON user_addresses;
CREATE TRIGGER trg_touch_user_addresses_updated_at
    BEFORE UPDATE ON user_addresses
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

CREATE OR REPLACE FUNCTION fn_ensure_single_default_address() RETURNS TRIGGER AS $$
BEGIN
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

DROP TRIGGER IF EXISTS trg_ensure_single_default_address ON user_addresses;
CREATE TRIGGER trg_ensure_single_default_address
    BEFORE INSERT OR UPDATE OF is_default ON user_addresses
    FOR EACH ROW EXECUTE FUNCTION fn_ensure_single_default_address();

ALTER TABLE user_addresses
    ADD CONSTRAINT chk_phone_format
        CHECK (phone ~ '^[0-9+\-\s\(\)]{10,20}$'),
    ADD CONSTRAINT chk_receiver_name_length
        CHECK (char_length(trim(receiver_name)) >= 2),
    ADD CONSTRAINT chk_detail_address_length
        CHECK (char_length(trim(detail_address)) >= 5);

-- v1.6: 订单地址与快照
CREATE EXTENSION IF NOT EXISTS pgcrypto;
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS shipping_address_id  UUID REFERENCES user_addresses(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS shipping_address_snapshot JSONB;

CREATE OR REPLACE FUNCTION fn_update_shipping_address_snapshot() RETURNS TRIGGER AS $$
BEGIN
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

DROP TRIGGER IF EXISTS trg_update_shipping_address_snapshot ON orders;
CREATE TRIGGER trg_update_shipping_address_snapshot
    BEFORE INSERT OR UPDATE OF shipping_address_id ON orders
    FOR EACH ROW EXECUTE FUNCTION fn_update_shipping_address_snapshot();

CREATE INDEX IF NOT EXISTS idx_orders_shipping_address_id
    ON orders(shipping_address_id)
    WHERE shipping_address_id IS NOT NULL;

COMMENT ON COLUMN orders.shipping_address_id IS '收货地址ID（外键到user_addresses表）';
COMMENT ON COLUMN orders.shipping_address_snapshot IS '地址信息快照，防止地址被删除后订单信息丢失';


-- =====================================================================
-- 7) 分类初始化数据（来自 category_init_data.sql）
-- =====================================================================

-- 清理旧引用与数据
UPDATE products SET category_id = NULL WHERE category_id IS NOT NULL;
DELETE FROM product_categories;
ALTER SEQUENCE product_categories_id_seq RESTART WITH 1000;

-- 一级分类
INSERT INTO product_categories (id, name, parent_id) VALUES
(1000, '数码电子', NULL),
(2000, '生活用品', NULL),
(3000, '图书文娱', NULL),
(9000, '其他分类', NULL);

-- 二级分类
INSERT INTO product_categories (id, name, parent_id) VALUES
(1001, '手机通讯', 1000),
(1002, '电脑办公', 1000),
(1003, '数码影音', 1000),
(1004, '家用电器', 1000),
(2001, '服装鞋包', 2000),
(2002, '美妆个护', 2000),
(2003, '家居生活', 2000),
(2004, '运动户外', 2000),
(2005, '母婴用品', 2000),
(3001, '图书杂志', 3000),
(3002, '文体用品', 3000),
(3003, '游戏娱乐', 3000),
(9001, '其他', 9000);

-- 三级分类
INSERT INTO product_categories (id, name, parent_id) VALUES
(1011, '智能手机', 1001),
(1012, '手机配件', 1001),
(1013, '对讲机', 1001),
(1021, '笔记本电脑', 1002),
(1022, '台式电脑', 1002),
(1023, '平板电脑', 1002),
(1024, '电脑配件', 1002),
(1025, '办公设备', 1002),
(1031, '数码相机', 1003),
(1032, '摄像设备', 1003),
(1033, '耳机音响', 1003),
(1034, '智能手表', 1003),
(1035, '无人机', 1003),
(1041, '大型家电', 1004),
(1042, '小型家电', 1004),
(1043, '厨房电器', 1004),
(2011, '男装', 2001),
(2012, '女装', 2001),
(2013, '童装', 2001),
(2014, '男鞋', 2001),
(2015, '女鞋', 2001),
(2016, '箱包', 2001),
(2017, '配饰', 2001),
(2021, '护肤品', 2002),
(2022, '彩妆', 2002),
(2023, '香水', 2002),
(2024, '个人护理', 2002),
(2031, '家具', 2003),
(2032, '家纺用品', 2003),
(2033, '厨房用品', 2003),
(2034, '收纳整理', 2003),
(2035, '装饰用品', 2003),
(2041, '健身器材', 2004),
(2042, '运动服饰', 2004),
(2043, '户外用品', 2004),
(2044, '运动鞋', 2004),
(2051, '奶粉辅食', 2005),
(2052, '纸尿裤', 2005),
(2053, '婴儿用品', 2005),
(2054, '儿童玩具', 2005),
(3011, '小说文学', 3001),
(3012, '教育考试', 3001),
(3013, '科技计算机', 3001),
(3014, '生活时尚', 3001),
(3015, '杂志期刊', 3001),
(3021, '文具用品', 3002),
(3022, '乐器', 3002),
(3023, '绘画用品', 3002),
(3031, '游戏机', 3003),
(3032, '游戏软件', 3003),
(3033, '桌游卡牌', 3003);

-- 核对输出（与原脚本一致）
SELECT
    CASE
        WHEN parent_id IS NULL THEN '一级: ' || name
        WHEN id IN (SELECT DISTINCT parent_id FROM product_categories WHERE parent_id IS NOT NULL) THEN '  二级: ' || name
        ELSE '    三级: ' || name
    END as category_tree,
    id,
    parent_id
FROM product_categories
ORDER BY id;

SELECT
    CASE
        WHEN parent_id IS NULL THEN '一级分类'
        WHEN id IN (SELECT DISTINCT parent_id FROM product_categories WHERE parent_id IS NOT NULL) THEN '二级分类'
        ELSE '三级分类'
    END as level,
    COUNT(*) as count
FROM product_categories
GROUP BY
    CASE
        WHEN parent_id IS NULL THEN '一级分类'
        WHEN id IN (SELECT DISTINCT parent_id FROM product_categories WHERE parent_id IS NOT NULL) THEN '二级分类'
        ELSE '三级分类'
    END
ORDER BY level;

