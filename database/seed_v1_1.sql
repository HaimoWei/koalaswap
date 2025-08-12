BEGIN;

-- 清空数据（按外键顺序），并重置自增/序列
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
    email_verification_tokens,  -- ← 新表名
    password_reset_tokens,      -- ← 字段为 token_hash
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
    ('bob@example.com',   '$2a$10$7EqJtq98hPqEX7fNZaFWoOHi1HE9Z8wUVAvzk1H/Vf5/6W7NmmIi', 'Bob',   'https://i.pravatar.cc/150?img=2', 'Love gadgets', true, 2, NOW() - INTERVAL '10 days'),
    ('carol@example.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoOHi1HE9Z8wUVAvzk1H/Vf5/6W7NmmIi', 'Carol', 'https://i.pravatar.cc/150?img=3', 'Student', false, 1, NOW() - INTERVAL '20 days'),
    ('dave@example.com',  '$2a$10$7EqJtq98hPqEX7fNZaFWoOHi1HE9Z8wUVAvzk1H/Vf5/6W7NmmIi', 'Dave',  'https://i.pravatar.cc/150?img=4', 'Switch gamer', true, 3, NOW() - INTERVAL '2 days'),
    ('erin@example.com',  '$2a$10$7EqJtq98hPqEX7fNZaFWoOHi1HE9Z8wUVAvzk1H/Vf5/6W7NmmIi', 'Erin',  'https://i.pravatar.cc/150?img=5', 'Action cams', false, 1, NOW() - INTERVAL '90 days');

-- 3) 商品
INSERT INTO products (seller_id, title, description, price, currency, category_id, "condition", is_active, created_at)
VALUES
    ((SELECT id FROM users WHERE email='alice@example.com'),
     'iPhone 13 128GB', 'Near-mint, battery 90%', 650.00, 'AUD', (SELECT id FROM product_categories WHERE name='Phones'), 'LIKE_NEW', true, NOW() - INTERVAL '14 days'),

    ((SELECT id FROM users WHERE email='alice@example.com'),
     'Samsung Galaxy S21', 'Good condition', 520.00, 'AUD', (SELECT id FROM product_categories WHERE name='Phones'), 'GOOD', true, NOW() - INTERVAL '18 days'),

    ((SELECT id FROM users WHERE email='bob@example.com'),
     'MacBook Air M1 8G/256G', 'Lightly used', 1150.00, 'AUD', (SELECT id FROM product_categories WHERE name='Laptops'), 'LIKE_NEW', true, NOW() - INTERVAL '20 days'),

    ((SELECT id FROM users WHERE email='bob@example.com'),
     'iPad Pro 11\" 2021', 'With pencil & case', 820.00, 'AUD', (SELECT id FROM product_categories WHERE name='Laptops'), 'GOOD', true, NOW() - INTERVAL '9 days'),

    ((SELECT id FROM users WHERE email='carol@example.com'),
     'Sony WH-1000XM4', 'Minor scratches', 240.00, 'AUD', (SELECT id FROM product_categories WHERE name='Audio'), 'GOOD', true, NOW() - INTERVAL '28 days'),

    ((SELECT id FROM users WHERE email='dave@example.com'),
     'Nintendo Switch', 'Neon Red/Blue', 360.00, 'AUD', (SELECT id FROM product_categories WHERE name='Consoles'), 'GOOD', false, NOW() - INTERVAL '45 days'),

    ((SELECT id FROM users WHERE email='dave@example.com'),
     'Kindle Paperwhite', '8GB, 2019', 110.00, 'AUD', (SELECT id FROM product_categories WHERE name='Books'), 'FAIR', true, NOW() - INTERVAL '6 days'),

    ((SELECT id FROM users WHERE email='erin@example.com'),
     'GoPro HERO9 Black', 'Full set, 2 batteries', 380.00, 'AUD', (SELECT id FROM product_categories WHERE name='Cameras'), 'LIKE_NEW', true, NOW() - INTERVAL '4 days');

-- 4) 商品图片两张（0/1）
INSERT INTO product_images (product_id, image_url, sort_order)
SELECT p.id, 'https://picsum.photos/seed/' || substr(p.id::text,1,8) || '-1/800/600', 0 FROM products p;
INSERT INTO product_images (product_id, image_url, sort_order)
SELECT p.id, 'https://picsum.photos/seed/' || substr(p.id::text,1,8) || '-2/800/600', 1 FROM products p;

-- 5) 收藏
INSERT INTO favourites (user_id, product_id) VALUES
                                                 ((SELECT id FROM users WHERE email='carol@example.com'),
                                                  (SELECT id FROM products WHERE title='iPhone 13 128GB')),
                                                 ((SELECT id FROM users WHERE email='alice@example.com'),
                                                  (SELECT id FROM products WHERE title='MacBook Air M1 8G/256G'));

-- 6) 订单
INSERT INTO orders (product_id, buyer_id, seller_id, price_snapshot, status, created_at, closed_at) VALUES
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

-- 7) 订单评价
INSERT INTO order_reviews (order_id, reviewer_id, reviewee_id, rating, comment) VALUES
                                                                                    ((SELECT id FROM orders WHERE (SELECT title FROM products WHERE id=orders.product_id)='Kindle Paperwhite'),
                                                                                     (SELECT id FROM users WHERE email='alice@example.com'),
                                                                                     (SELECT id FROM users WHERE email='dave@example.com'),
                                                                                     5, 'Quick response, item as described.'),

                                                                                    ((SELECT id FROM orders WHERE (SELECT title FROM products WHERE id=orders.product_id)='Kindle Paperwhite'),
                                                                                     (SELECT id FROM users WHERE email='dave@example.com'),
                                                                                     (SELECT id FROM users WHERE email='alice@example.com'),
                                                                                     5, 'Smooth meetup, recommended buyer.');

-- 8) 会话 & 参与者 & 消息（围绕 iPhone 13）
INSERT INTO conversations (product_id)
VALUES ((SELECT id FROM products WHERE title='iPhone 13 128GB'));

INSERT INTO conversation_participants (conversation_id, user_id)
SELECT c.id, u.id
FROM conversations c
         JOIN users u ON u.email IN ('alice@example.com','carol@example.com')
WHERE c.product_id = (SELECT id FROM products WHERE title='iPhone 13 128GB');

INSERT INTO messages (conversation_id, sender_id, body_text, is_read, sent_at) VALUES
                                                                                   ((SELECT id FROM conversations WHERE product_id=(SELECT id FROM products WHERE title='iPhone 13 128GB')),
                                                                                    (SELECT id FROM users WHERE email='carol@example.com'),
                                                                                    'Hi, can you do 600?', false, NOW() - INTERVAL '2 hours'),
                                                                                   ((SELECT id FROM conversations WHERE product_id=(SELECT id FROM products WHERE title='iPhone 13 128GB')),
                                                                                    (SELECT id FROM users WHERE email='alice@example.com'),
                                                                                    '650 is already fair—battery is 90%.', false, NOW() - INTERVAL '90 minutes');

-- 9) 邮箱验证示例（与你现在的实体一致：明文 token）
INSERT INTO email_verification_tokens (id, user_id, token, created_at, expires_at, used_at) VALUES
                                                                                                (gen_random_uuid(), (SELECT id FROM users WHERE email='carol@example.com'), 'seed-verify-carol-1', NOW(), NOW() + INTERVAL '1 day', NULL),
                                                                                                (gen_random_uuid(), (SELECT id FROM users WHERE email='erin@example.com'),  'seed-verify-erin-1',  NOW(), NOW() + INTERVAL '2 days', NULL);

-- 10) 重置密码令牌示例（与你现在的实体一致：token_hash）
INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used, created_at)
VALUES
    ((SELECT id FROM users WHERE email='bob@example.com'), 'prthash_bob_1', NOW() + INTERVAL '2 hours', false, NOW());

COMMIT;
