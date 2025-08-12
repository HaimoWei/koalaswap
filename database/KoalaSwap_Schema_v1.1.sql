-- =====================================================================
-- KoalaSwap Schema (compat with current codebase)
-- 兼容：email_verification_tokens（老表名/老字段）
-- 保留：users.token_version / password_updated_at、搜索索引等
-- PostgreSQL >= 13
-- =====================================================================

-- 扩展 -------------------------------------------------------------------
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
