BEGIN;

-- 清空数据并重置自增（不影响 UUID 自动生成）
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
    email_verifications,
    password_reset_tokens,
    users
    RESTART IDENTITY CASCADE;

-- 1) 分类
INSERT INTO product_categories (name) VALUES
                                          ('Phones'), ('Laptops'), ('Audio'), ('Consoles'), ('Cameras'), ('Books');

-- 2) 用户（密码统一为 "password" 的 BCrypt 哈希）
-- $2a$10$7EqJtq98hPqEX7fNZaFWoOHi1HE9Z8wUVAvzk1H/Vf5/6W7NmmIi
INSERT INTO users (email, password_hash, display_name, avatar_url, bio, email_verified, token_version, password_updated_at)
VALUES
    ('alice@example.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoOHi1HE9Z8wUVAvzk1H/Vf5/6W7NmmIi', 'Alice', 'https://i.pravatar.cc/150?img=1', 'iOS fan', true, 1, NOW() - INTERVAL '30 days'),
    ('bob@example.com',   '$2a$10$7EqJtq98hPqEX7fNZaFWoOHi1HE9Z8wUVAvzk1H/Vf5/6W7NmmIi', 'Bob',   'https://i.pravatar.cc/150?img=2', 'Love gadgets', true, 2, NOW() - INTERVAL '10 days'),  -- 用于测试旧 token 失效
    ('carol@example.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoOHi1HE9Z8wUVAvzk1H/Vf5/6W7NmmIi', 'Carol', 'https://i.pravatar.cc/150?img=3', 'Student', false, 1, NOW() - INTERVAL '20 days'),
    ('dave@example.com',  '$2a$10$7EqJtq98hPqEX7fNZaFWoOHi1HE9Z8wUVAvzk1H/Vf5/6W7NmmIi', 'Dave',  'https://i.pravatar.cc/150?img=4', 'Switch gamer', true, 3, NOW() - INTERVAL '2 days'),   -- 用于测试旧 token 失效
    ('erin@example.com',  '$2a$10$7EqJtq98hPqEX7fNZaFWoOHi1HE9Z8wUVAvzk1H/Vf5/6W7NmmIi', 'Erin',  'https://i.pravatar.cc/150?img=5', 'Action cams', false, 1, NOW() - INTERVAL '90 days');

-- 3) 商品
INSERT INTO products (seller_id, title, description, price, currency, category_id, condition, is_active, created_at)
VALUES
    ((SELECT id FROM users WHERE email='alice@example.com'),
     'iPhone 13 128GB', 'Near-mint, battery 90%', 650.00, 'AUD', (SELECT id FROM product_categories WHERE name='Phones'), 'LIKE_NEW', true, NOW() - INTERVAL '14 days'),

    ((SELECT id FROM users WHERE email='alice@example.com'),
     'Samsung Galaxy S21', 'Good condition', 520.00, 'AUD', (SELECT id FROM product_categories WHERE name='Phones'), 'GOOD', true, NOW() - INTERVAL '18 days'),

    ((SELECT id FROM users WHERE email='bob@example.com'),
     'MacBook Air M1 8G/256G', 'Lightly used', 1150.00, 'AUD', (SELECT id FROM product_categories WHERE name='Laptops'), 'LIKE_NEW', true, NOW() - INTERVAL '20 days'),

    ((SELECT id FROM users WHERE email='bob@example.com'),
     'iPad Pro 11" 2021', 'With pencil & case', 820.00, 'AUD', (SELECT id FROM product_categories WHERE name='Laptops'), 'GOOD', true, NOW() - INTERVAL '9 days'),

    ((SELECT id FROM users WHERE email='carol@example.com'),
     'Sony WH-1000XM4', 'Minor scratches', 240.00, 'AUD', (SELECT id FROM product_categories WHERE name='Audio'), 'GOOD', true, NOW() - INTERVAL '28 days'),

    ((SELECT id FROM users WHERE email='dave@example.com'),
     'Nintendo Switch', 'Neon Red/Blue', 360.00, 'AUD', (SELECT id FROM product_categories WHERE name='Consoles'), 'GOOD', false, NOW() - INTERVAL '45 days'),

    ((SELECT id FROM users WHERE email='dave@example.com'),
     'Kindle Paperwhite', '8GB, 2019', 110.00, 'AUD', (SELECT id FROM product_categories WHERE name='Books'), 'FAIR', true, NOW() - INTERVAL '6 days'),

    ((SELECT id FROM users WHERE email='erin@example.com'),
     'GoPro HERO9 Black', 'Full set, 2 batteries', 380.00, 'AUD', (SELECT id FROM product_categories WHERE name='Cameras'), 'LIKE_NEW', true, NOW() - INTERVAL '4 days');

-- 4) 商品图片：为每个商品自动生成两张示例图（sort_order 0/1）
INSERT INTO product_images (product_id, image_url, sort_order)
SELECT p.id, 'https://picsum.photos/seed/' || substr(p.id::text,1,8) || '-1/800/600', 0
FROM products p;
INSERT INTO product_images (product_id, image_url, sort_order)
SELECT p.id, 'https://picsum.photos/seed/' || substr(p.id::text,1,8) || '-2/800/600', 1
FROM products p;

-- 5) 收藏
INSERT INTO favourites (user_id, product_id)
VALUES
    ((SELECT id FROM users WHERE email='carol@example.com'),
     (SELECT id FROM products WHERE title='iPhone 13 128GB')),
    ((SELECT id FROM users WHERE email='alice@example.com'),
     (SELECT id FROM products WHERE title='MacBook Air M1 8G/256G'));

-- 6) 订单（以一本书和一台相机为例）
INSERT INTO orders (product_id, buyer_id, seller_id, price_snapshot, status, created_at, closed_at)
VALUES
    ((SELECT id FROM products WHERE title='Kindle Paperwhite'),
     (SELECT id FROM users WHERE email='alice@example.com'),
     (SELECT id FROM users WHERE email='dave@example.com'),
     (SELECT price FROM products WHERE title='Kindle Paperwhite'),
     'COMPLETED', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 days'),

    ((SELECT id FROM products WHERE title='GoPro HERO9 Black'),
     (SELECT id FROM users WHERE email='bob@example.com'),
     (SELECT id FROM users WHERE email='erin@example.com'),
     (SELECT price FROM products WHERE title='GoPro HERO9 Black'),
     'PAID', NOW() - INTERVAL '1 days', NULL);

-- 7) 订单评价（同一订单双方各评一次）
INSERT INTO order_reviews (order_id, reviewer_id, reviewee_id, rating, comment)
VALUES
    ((SELECT id FROM orders WHERE (SELECT title FROM products WHERE id=orders.product_id)='Kindle Paperwhite'),
     (SELECT id FROM users WHERE email='alice@example.com'),
     (SELECT id FROM users WHERE email='dave@example.com'),
     5, 'Quick response, item as described.'),

    ((SELECT id FROM orders WHERE (SELECT title FROM products WHERE id=orders.product_id)='Kindle Paperwhite'),
     (SELECT id FROM users WHERE email='dave@example.com'),
     (SELECT id FROM users WHERE email='alice@example.com'),
     5, 'Smooth meetup, recommended buyer.');

-- 8) 会话 & 消息（围绕 iPhone 13）
INSERT INTO conversations (product_id)
VALUES ((SELECT id FROM products WHERE title='iPhone 13 128GB'));

-- 参与者：Alice（卖家）和 Carol（买家候选）
INSERT INTO conversation_participants (conversation_id, user_id)
SELECT c.id, u.id
FROM conversations c
         JOIN users u ON u.email IN ('alice@example.com','carol@example.com')
WHERE c.product_id = (SELECT id FROM products WHERE title='iPhone 13 128GB');

-- 消息
INSERT INTO messages (conversation_id, sender_id, body_text, is_read, sent_at)
VALUES
    ((SELECT id FROM conversations WHERE product_id=(SELECT id FROM products WHERE title='iPhone 13 128GB')),
     (SELECT id FROM users WHERE email='carol@example.com'),
     'Hi, can you do 600?', false, NOW() - INTERVAL '2 hours'),
    ((SELECT id FROM conversations WHERE product_id=(SELECT id FROM products WHERE title='iPhone 13 128GB')),
     (SELECT id FROM users WHERE email='alice@example.com'),
     '650 is already fair—battery is 90%.', false, NOW() - INTERVAL '90 minutes');

-- 9) 邮箱验证示例
INSERT INTO email_verifications (user_id, token_hash, expires_at, used, created_at)
VALUES
    ((SELECT id FROM users WHERE email='carol@example.com'), 'evhash_carol_1', NOW() + INTERVAL '1 day', false, NOW()),
    ((SELECT id FROM users WHERE email='erin@example.com'),  'evhash_erin_1',  NOW() + INTERVAL '2 days', false, NOW());

-- 10) 重置密码令牌示例
INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used, created_at)
VALUES
    ((SELECT id FROM users WHERE email='bob@example.com'), 'prthash_bob_1', NOW() + INTERVAL '2 hours', false, NOW());

COMMIT;

-- \echo '✅ seed_v1_1 完成'
