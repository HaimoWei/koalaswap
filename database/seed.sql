\encoding UTF8
-- KoalaSwap seed data (idempotent: 先清空再插入)
-- =================================================

-- 强制删除所有现有数据并重置自增序列
TRUNCATE TABLE
    messages,
    conversation_participants,
    conversations,
    order_reviews,
    orders,
    favourites,
    product_images,
    products,
    product_categories,
    users
    RESTART IDENTITY CASCADE;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. 分类 --------------------------------------------------------
INSERT INTO product_categories (name) VALUES
                                          ('电子产品'), ('书籍'), ('家具');

-- 2. 用户 --------------------------------------------------------
INSERT INTO users (email, password_hash, display_name, avatar_url, bio, email_verified) VALUES
                                                                                            ('alice@example.com',
                                                                                             crypt('password123', gen_salt('bf')),
                                                                                             'Alice','https://i.pravatar.cc/150?img=5','墨尔本极客女孩',TRUE),

                                                                                            ('bob@example.com',
                                                                                             crypt('password123', gen_salt('bf')),
                                                                                             'Bob','https://i.pravatar.cc/150?img=6','悉尼二手发烧友',TRUE),

                                                                                            ('charlie@example.com',
                                                                                             crypt('password123', gen_salt('bf')),
                                                                                             'Charlie','https://i.pravatar.cc/150?img=7','布里斯班学生党',FALSE);

-- 把用户放进临时表
SELECT id, email INTO TEMP tmp_users FROM users;

-- 3. 商品 --------------------------------------------------------
INSERT INTO products (seller_id,title,description,price_numeric,currency,category_id,condition) VALUES
                                                                                                    ((SELECT id FROM tmp_users WHERE email='alice@example.com'),
                                                                                                     '二手 iPhone 13 128G','配件齐全，电池健康 90%，包装盒还在',650,'AUD',1,'GOOD'),

                                                                                                    ((SELECT id FROM tmp_users WHERE email='bob@example.com'),
                                                                                                     '《Clean Code》英文原版','封面边角略有磨损，内页无标记',25,'AUD',2,'LIKE_NEW'),

                                                                                                    ((SELECT id FROM tmp_users WHERE email='bob@example.com'),
                                                                                                     '宜家 LACK 小茶几（白色）','自取，轻便好搬，几乎无划痕',15,'AUD',3,'GOOD');

-- 4. 商品图片 ----------------------------------------------------
INSERT INTO product_images (product_id,image_url,sort_order)
SELECT id,'https://picsum.photos/seed/'||id||'/400/300',0 FROM products;

-- 5. 收藏 --------------------------------------------------------
INSERT INTO favourites (user_id,product_id) VALUES
                                                ((SELECT id FROM tmp_users WHERE email='charlie@example.com'),
                                                 (SELECT id FROM products LIMIT 1)),
                                                ((SELECT id FROM tmp_users WHERE email='alice@example.com'),
                                                 (SELECT id FROM products OFFSET 1 LIMIT 1));

-- 6. 订单 --------------------------------------------------------
INSERT INTO orders (product_id,buyer_id,seller_id,price_snapshot,status,created_at,closed_at) VALUES
    ((SELECT id FROM products OFFSET 1 LIMIT 1),
     (SELECT id FROM tmp_users WHERE email='alice@example.com'),
     (SELECT id FROM tmp_users WHERE email='bob@example.com'),
     25,'COMPLETED',NOW()-INTERVAL '2 days',NOW()-INTERVAL '1 day');

-- 7. 订单评价 ----------------------------------------------------
INSERT INTO order_reviews (order_id,reviewer_id,reviewee_id,rating,comment) VALUES
                                                                                ((SELECT id FROM orders LIMIT 1),
                                                                                 (SELECT id FROM tmp_users WHERE email='alice@example.com'),
                                                                                 (SELECT id FROM tmp_users WHERE email='bob@example.com'),5,
                                                                                 '卖家发货快，书几乎全新👍'),

                                                                                ((SELECT id FROM orders LIMIT 1),
                                                                                 (SELECT id FROM tmp_users WHERE email='bob@example.com'),
                                                                                 (SELECT id FROM tmp_users WHERE email='alice@example.com'),5,
                                                                                 '买家沟通顺畅，当面交易愉快！');

-- 8. 聊天 -------------------------------------------------------
INSERT INTO conversations (product_id)
VALUES ((SELECT id FROM products LIMIT 1));

INSERT INTO conversation_participants (conversation_id,user_id)
SELECT c.id,u.id
FROM conversations c,
     (SELECT id FROM tmp_users WHERE email IN ('alice@example.com','charlie@example.com')) u;

INSERT INTO messages (conversation_id,sender_id,body_text,is_read,sent_at) VALUES
                                                                               ((SELECT id FROM conversations LIMIT 1),
                                                                                (SELECT id FROM tmp_users WHERE email='charlie@example.com'),
                                                                                'Hi，iPhone 13还能小刀吗？',FALSE,NOW()-INTERVAL '2 hours'),

                                                                               ((SELECT id FROM conversations LIMIT 1),
                                                                                (SELECT id FROM tmp_users WHERE email='alice@example.com'),
                                                                                '已是最低价～配件很新哦',FALSE,NOW()-INTERVAL '90 minutes');

\echo '✅ KoalaSwap seed 完成！'
