-- =====================================================================
-- KoalaSwap 全量 Schema v1.1  (PostgreSQL ≥ 13)
-- 覆盖：用户/邮箱验证/密码重置 + 商品/图片/收藏 + 订单/评价 + 会话/消息
-- 增强：令牌版本号(token_version)机制、更新时间触发器、搜索索引修正
-- =====================================================================

-- 扩展 -------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ENUM 类型 --------------------------------------------------------------
DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_condition') THEN
            CREATE TYPE product_condition AS ENUM ('NEW','LIKE_NEW','GOOD','FAIR','POOR');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
            CREATE TYPE order_status AS ENUM ('PENDING','PAID','SHIPPED','COMPLETED','CANCELLED');
        END IF;
    END $$;

-- 通用：自动更新时间戳 ---------------------------------------------------
CREATE OR REPLACE FUNCTION fn_touch_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 用户域 -----------------------------------------------------------------
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
    -- 新增：令牌版本号与密码更新时间（用于“改密后旧 token 立刻失效”）
                                     token_version       INT NOT NULL DEFAULT 1,
                                     password_updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
                                     created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
                                     updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- users.updated_at 自动更新
DROP TRIGGER IF EXISTS trg_touch_users_updated_at ON users;
CREATE TRIGGER trg_touch_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

-- 密码变更自动提升 token_version + 更新时间
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

-- products.updated_at 自动更新
DROP TRIGGER IF EXISTS trg_touch_products_updated_at ON products;
CREATE TRIGGER trg_touch_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

-- 全文搜索触发器
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

-- 写评价后刷新被评人均分/次数
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

-- 邮箱验证 ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_verifications (
                                                   token_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                                   user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                                   token_hash VARCHAR(128) NOT NULL,
                                                   expires_at TIMESTAMP NOT NULL,
                                                   used       BOOLEAN NOT NULL DEFAULT FALSE,
                                                   created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                                                   used_at    TIMESTAMP
);

-- 密码重置令牌 -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_reset_tokens (
                                                     token_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                                     user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                                     token_hash VARCHAR(128) NOT NULL,
                                                     expires_at TIMESTAMP NOT NULL,
                                                     used       BOOLEAN NOT NULL DEFAULT FALSE,
                                                     created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                                                     used_at    TIMESTAMP
);

-- 索引 -------------------------------------------------------------------
-- 商品：分类+价格；上架+时间；上架+价格；全文搜索
CREATE INDEX IF NOT EXISTS idx_products_category_price            ON products(category_id, price);
CREATE INDEX IF NOT EXISTS idx_products_active_created_at         ON products(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_active_price              ON products(is_active, price);
CREATE INDEX IF NOT EXISTS idx_products_search                    ON products USING GIN (search_vector);

-- 订单：买家/卖家
CREATE INDEX IF NOT EXISTS idx_orders_buyer                       ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller                      ON orders(seller_id);

-- 消息：会话+时间
CREATE INDEX IF NOT EXISTS idx_messages_conv_time                 ON messages(conversation_id, sent_at DESC);

-- 收藏/参与者：便于查我的列表
CREATE INDEX IF NOT EXISTS idx_favourites_user_time               ON favourites(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conv_participants_user             ON conversation_participants(user_id);

-- 邮件/重置：按哈希/过期清理
CREATE UNIQUE INDEX IF NOT EXISTS ux_ev_token_hash                ON email_verifications(token_hash);
CREATE INDEX        IF NOT EXISTS ix_ev_user_expires             ON email_verifications(user_id, expires_at);

CREATE UNIQUE INDEX IF NOT EXISTS ux_prt_token_hash               ON password_reset_tokens(token_hash);
CREATE INDEX        IF NOT EXISTS ix_prt_user_expires            ON password_reset_tokens(user_id, expires_at);
