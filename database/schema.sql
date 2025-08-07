-- KoalaSwap Core Schema v1.0  (PostgreSQL ≥13)
-- ===============================================================

-- 1. ENUM 类型 ---------------------------------------------------
CREATE TYPE product_condition AS ENUM ('NEW','LIKE_NEW','GOOD','FAIR','POOR');
CREATE TYPE order_status      AS ENUM ('PENDING','PAID','SHIPPED','COMPLETED','CANCELLED');

-- 2. users 用户表 ------------------------------------------------
CREATE TABLE users (
                       id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                       email          VARCHAR(320) UNIQUE NOT NULL,
                       password_hash  TEXT NOT NULL,
                       display_name   VARCHAR(120) NOT NULL,
                       avatar_url     TEXT,
                       bio            TEXT,
                       email_verified BOOLEAN NOT NULL DEFAULT FALSE,
                       rating_avg     NUMERIC(2,1) NOT NULL DEFAULT 0,
                       rating_count   INT          NOT NULL DEFAULT 0,
                       created_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 3. product_categories 商品分类表 ------------------------------
CREATE TABLE product_categories (
                                    id        SERIAL PRIMARY KEY,
                                    name      VARCHAR(120) UNIQUE NOT NULL,
                                    parent_id INT REFERENCES product_categories(id) ON DELETE SET NULL
);

-- 4. products 商品表 --------------------------------------------
CREATE TABLE products (
                          id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                          seller_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                          title          VARCHAR(200) NOT NULL,
                          description    TEXT,
                          price_numeric  NUMERIC(10,2) NOT NULL CHECK (price_numeric >= 0),
                          currency       VARCHAR(10)   NOT NULL DEFAULT 'AUD',
                          category_id    INT REFERENCES product_categories(id),
                          condition      product_condition NOT NULL DEFAULT 'GOOD',
                          is_active      BOOLEAN NOT NULL DEFAULT TRUE,
                          created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 5. product_images 商品图片表 ----------------------------------
CREATE TABLE product_images (
                                id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                                image_url   TEXT NOT NULL,
                                sort_order  INT  NOT NULL DEFAULT 0
);

-- 6. favourites 收藏表 ------------------------------------------
CREATE TABLE favourites (
                            user_id     UUID REFERENCES users(id)    ON DELETE CASCADE,
                            product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
                            created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
                            PRIMARY KEY (user_id, product_id)
);

-- 7. orders 订单表 ----------------------------------------------
CREATE TABLE orders (
                        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        product_id     UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
                        buyer_id       UUID NOT NULL REFERENCES users(id)    ON DELETE RESTRICT,
                        seller_id      UUID NOT NULL REFERENCES users(id)    ON DELETE RESTRICT,
                        price_snapshot NUMERIC(10,2) NOT NULL,
                        status         order_status NOT NULL DEFAULT 'PENDING',
                        created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
                        closed_at      TIMESTAMP
);

-- 8. order_reviews 订单评价表 ------------------------------------
CREATE TABLE order_reviews (
                               id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                               order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                               reviewer_id  UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
                               reviewee_id  UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
                               rating       SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
                               comment      TEXT,
                               created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
                               UNIQUE (order_id, reviewer_id)    -- 一单一评
);

-- 9. conversations 会话表 ---------------------------------------
CREATE TABLE conversations (
                               id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                               product_id UUID REFERENCES products(id) ON DELETE SET NULL,
                               created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 10. conversation_participants 会话成员表 ----------------------
CREATE TABLE conversation_participants (
                                           conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
                                           user_id         UUID REFERENCES users(id)         ON DELETE CASCADE,
                                           joined_at       TIMESTAMP NOT NULL DEFAULT NOW(),
                                           PRIMARY KEY (conversation_id, user_id)
);

-- 11. messages 消息表 -------------------------------------------
CREATE TABLE messages (
                          id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                          conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
                          sender_id       UUID NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
                          body_text       TEXT NOT NULL,
                          is_read         BOOLEAN NOT NULL DEFAULT FALSE,
                          sent_at         TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 12. 索引 ------------------------------------------------------
CREATE INDEX idx_products_category_price ON products(category_id, price_numeric);
CREATE INDEX idx_orders_buyer           ON orders(buyer_id);
CREATE INDEX idx_orders_seller          ON orders(seller_id);
CREATE INDEX idx_messages_conv_time     ON messages(conversation_id, sent_at DESC);

-- 13. 商品全文搜索 ----------------------------------------------
ALTER TABLE products ADD COLUMN search_vector tsvector;

CREATE INDEX idx_products_search ON products USING GIN(search_vector);

CREATE OR REPLACE FUNCTION products_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
      to_tsvector('english',
                  coalesce(NEW.title,'') || ' ' || coalesce(NEW.description,''));
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_search
    BEFORE INSERT OR UPDATE ON products
                         FOR EACH ROW EXECUTE FUNCTION products_search_trigger();

-- 14. 写评价后刷新用户平均分 ------------------------------------
CREATE OR REPLACE FUNCTION fn_update_user_rating() RETURNS trigger AS $$
BEGIN
UPDATE users u
SET rating_count = sub.cnt,
    rating_avg   = COALESCE(sub.avg,0)
    FROM (
        SELECT reviewee_id,
               COUNT(*)                 AS cnt,
               ROUND(AVG(rating)::NUMERIC,1) AS avg
        FROM   order_reviews
        WHERE  reviewee_id = NEW.reviewee_id
        GROUP  BY reviewee_id
       ) sub
WHERE u.id = sub.reviewee_id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_user_rating
    AFTER INSERT OR UPDATE ON order_reviews
                        FOR EACH ROW EXECUTE FUNCTION fn_update_user_rating();
