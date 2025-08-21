-- ============================================================================
-- KoalaSwap SEED DATA (for combined_schema.sql)
-- Generated: 2025-08-21T06:37:40
-- Notes:
--  - Run AFTER applying combined_schema.sql (which includes the favourites→favorites rename).
--  - Uses sub-selects to resolve FK relationships by business keys (email, title, name).
--  - Safe to re-run thanks to TRUNCATE ... RESTART IDENTITY CASCADE at the top.
-- ============================================================================

BEGIN;

-- 0) Clean tables
TRUNCATE TABLE
  messages,
  conversation_participants,
  conversations,
  order_review_appends,
  review_slots,
  order_reviews,
  orders,
  favorites,
  product_images,
  products,
  product_categories,
  email_verification_tokens,
  password_reset_tokens,
  users
RESTART IDENTITY CASCADE;

-- 1) Users
INSERT INTO users (email, password_hash, display_name, avatar_url, bio, email_verified, created_at, updated_at)
VALUES
  ('alice@example.com', '$2a$10$wJwQ3ZtHcQ9CzD6L4sWn6e7X7z2V4o9kBvXvQO3LZ8kj9w3sX9o2a', 'Alice', NULL, 'Seller of tech & gadgets', TRUE, NOW() - INTERVAL '60 days', NOW() - INTERVAL '1 day'),
  ('bob@example.com',   '$2a$10$wJwQ3ZtHcQ9CzD6L4sWn6e7X7z2V4o9kBvXvQO3LZ8kj9w3sX9o2b', 'Bob',   NULL, 'Looking for budget phones', FALSE, NOW() - INTERVAL '45 days', NOW() - INTERVAL '1 day'),
  ('carol@example.com', '$2a$10$wJwQ3ZtHcQ9CzD6L4sWn6e7X7z2V4o9kBvXvQO3LZ8kj9w3sX9o2c', 'Carol', NULL, 'Selling laptops occasionally', TRUE, NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day'),
  ('dave@example.com',  '$2a$10$wJwQ3ZtHcQ9CzD6L4sWn6e7X7z2V4o9kBvXvQO3LZ8kj9w3sX9o2d', 'Dave',  NULL, 'Avid reader & collector', TRUE, NOW() - INTERVAL '20 days', NOW() - INTERVAL '1 day'),
  ('erin@example.com',  '$2a$10$wJwQ3ZtHcQ9CzD6L4sWn6e7X7z2V4o9kBvXvQO3LZ8kj9w3sX9o2e', 'Erin',  NULL, 'Sneaker fan', FALSE, NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'),
  ('frank@example.com', '$2a$10$wJwQ3ZtHcQ9CzD6L4sWn6e7X7z2V4o9kBvXvQO3LZ8kj9w3sX9o2f', 'Frank', NULL, 'Student on a budget', FALSE, NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day');

-- 2) Product categories (with simple hierarchy)
INSERT INTO product_categories (name, parent_id) VALUES
  ('Electronics', NULL),
  ('Phones',      (SELECT id FROM product_categories WHERE name = 'Electronics')),
  ('Laptops',     (SELECT id FROM product_categories WHERE name = 'Electronics')),
  ('Fashion',     NULL),
  ('Books',       NULL),
  ('Home',        NULL);

-- 3) Products
INSERT INTO products (seller_id, title, description, price, currency, category_id, condition, is_active, created_at, updated_at)
VALUES
  ((SELECT id FROM users WHERE email='alice@example.com'), 'iPhone 13 128GB', 'Lightly used, battery health 92%', 750.00, 'AUD', (SELECT id FROM product_categories WHERE name='Phones'), 'LIKE_NEW', TRUE, NOW() - INTERVAL '25 days', NOW() - INTERVAL '1 day'),
  ((SELECT id FROM users WHERE email='alice@example.com'), 'MacBook Air M1 16GB/512GB', 'Great condition, original box', 1200.00, 'AUD', (SELECT id FROM product_categories WHERE name='Laptops'), 'GOOD', TRUE, NOW() - INTERVAL '28 days', NOW() - INTERVAL '1 day'),
  ((SELECT id FROM users WHERE email='carol@example.com'), 'Dell XPS 13 2022', 'Excellent battery life', 1400.00, 'AUD', (SELECT id FROM product_categories WHERE name='Laptops'), 'LIKE_NEW', TRUE, NOW() - INTERVAL '18 days', NOW() - INTERVAL '1 day'),
  ((SELECT id FROM users WHERE email='dave@example.com'),  'Kindle Paperwhite', '10th gen, ads removed', 120.00, 'AUD', (SELECT id FROM product_categories WHERE name='Electronics'), 'GOOD', TRUE, NOW() - INTERVAL '12 days', NOW() - INTERVAL '1 day'),
  ((SELECT id FROM users WHERE email='erin@example.com'),  'Nike Air Max 270', 'Worn a few times', 90.00, 'AUD', (SELECT id FROM product_categories WHERE name='Fashion'), 'GOOD', TRUE, NOW() - INTERVAL '15 days', NOW() - INTERVAL '1 day'),
  ((SELECT id FROM users WHERE email='frank@example.com'), 'IKEA Lamp', 'Simple desk lamp', 15.00, 'AUD', (SELECT id FROM product_categories WHERE name='Home'), 'GOOD', TRUE, NOW() - INTERVAL '8 days', NOW() - INTERVAL '1 day');

-- 4) Product images
INSERT INTO product_images (product_id, image_url, sort_order, created_at) VALUES
  ((SELECT id FROM products WHERE title='iPhone 13 128GB'), 'https://picsum.photos/seed/iphone13/800/600', 0, NOW() - INTERVAL '24 days'),
  ((SELECT id FROM products WHERE title='MacBook Air M1 16GB/512GB'), 'https://picsum.photos/seed/mba-m1/800/600', 0, NOW() - INTERVAL '27 days'),
  ((SELECT id FROM products WHERE title='Dell XPS 13 2022'), 'https://picsum.photos/seed/xps13/800/600', 0, NOW() - INTERVAL '17 days'),
  ((SELECT id FROM products WHERE title='Kindle Paperwhite'), 'https://picsum.photos/seed/kindle/800/600', 0, NOW() - INTERVAL '11 days'),
  ((SELECT id FROM products WHERE title='Nike Air Max 270'), 'https://picsum.photos/seed/airmax/800/600', 0, NOW() - INTERVAL '14 days'),
  ((SELECT id FROM products WHERE title='IKEA Lamp'), 'https://picsum.photos/seed/ikea-lamp/800/600', 0, NOW() - INTERVAL '7 days');

-- 5) Favorites (final table name after rename)
INSERT INTO favorites (user_id, product_id, created_at) VALUES
  ((SELECT id FROM users WHERE email='bob@example.com'),   (SELECT id FROM products WHERE title='iPhone 13 128GB'), NOW() - INTERVAL '20 days'),
  ((SELECT id FROM users WHERE email='frank@example.com'), (SELECT id FROM products WHERE title='iPhone 13 128GB'), NOW() - INTERVAL '19 days'),
  ((SELECT id FROM users WHERE email='bob@example.com'),   (SELECT id FROM products WHERE title='Kindle Paperwhite'), NOW() - INTERVAL '10 days'),
  ((SELECT id FROM users WHERE email='dave@example.com'),  (SELECT id FROM products WHERE title='MacBook Air M1 16GB/512GB'), NOW() - INTERVAL '21 days');

-- 6) Orders
-- Ensure only one OPEN order per product (PENDING/PAID/SHIPPED)
INSERT INTO orders (product_id, buyer_id, seller_id, price_snapshot, status, created_at, closed_at)
VALUES
  -- Completed deal: Bob bought Alice's iPhone
  (
    (SELECT id FROM products WHERE title='iPhone 13 128GB'),
    (SELECT id FROM users WHERE email='bob@example.com'),
    (SELECT seller_id FROM products WHERE title='iPhone 13 128GB'),
    (SELECT price FROM products WHERE title='iPhone 13 128GB'),
    'COMPLETED',
    NOW() - INTERVAL '18 days',
    NOW() - INTERVAL '17 days'
  ),
  -- Open order: Dave buying Carol's XPS (PENDING)
  (
    (SELECT id FROM products WHERE title='Dell XPS 13 2022'),
    (SELECT id FROM users WHERE email='dave@example.com'),
    (SELECT seller_id FROM products WHERE title='Dell XPS 13 2022'),
    (SELECT price FROM products WHERE title='Dell XPS 13 2022'),
    'PENDING',
    NOW() - INTERVAL '5 days',
    NULL
  ),
  -- Cancelled order for Nike shoes
  (
    (SELECT id FROM products WHERE title='Nike Air Max 270'),
    (SELECT id FROM users WHERE email='frank@example.com'),
    (SELECT seller_id FROM products WHERE title='Nike Air Max 270'),
    (SELECT price FROM products WHERE title='Nike Air Max 270'),
    'CANCELLED',
    NOW() - INTERVAL '9 days',
    NOW() - INTERVAL '8 days'
  ),
  -- Open order: Erin buying Alice's MacBook (SHIPPED)
  (
    (SELECT id FROM products WHERE title='MacBook Air M1 16GB/512GB'),
    (SELECT id FROM users WHERE email='erin@example.com'),
    (SELECT seller_id FROM products WHERE title='MacBook Air M1 16GB/512GB'),
    (SELECT price FROM products WHERE title='MacBook Air M1 16GB/512GB'),
    'SHIPPED',
    NOW() - INTERVAL '6 days',
    NULL
  ),
  -- Open order: Bob buying Dave's Kindle (PAID)
  (
    (SELECT id FROM products WHERE title='Kindle Paperwhite'),
    (SELECT id FROM users WHERE email='bob@example.com'),
    (SELECT seller_id FROM products WHERE title='Kindle Paperwhite'),
    (SELECT price FROM products WHERE title='Kindle Paperwhite'),
    'PAID',
    NOW() - INTERVAL '4 days',
    NULL
  );

-- 7) Order reviews (only for COMPLETED orders)
--   Insert a pair of reviews (buyer→seller and seller→buyer)
INSERT INTO order_reviews (order_id, reviewer_id, reviewee_id, rating, comment, created_at)
VALUES
  (
    (SELECT id FROM orders WHERE product_id = (SELECT id FROM products WHERE title='iPhone 13 128GB')),
    (SELECT id FROM users WHERE email='bob@example.com'),
    (SELECT seller_id FROM products WHERE title='iPhone 13 128GB'),
    5,
    'Great seller, item as described.',
    NOW() - INTERVAL '16 days'
  ),
  (
    (SELECT id FROM orders WHERE product_id = (SELECT id FROM products WHERE title='iPhone 13 128GB')),
    (SELECT seller_id FROM products WHERE title='iPhone 13 128GB'),
    (SELECT id FROM users WHERE email='bob@example.com'),
    5,
    'Smooth transaction, prompt payment.',
    NOW() - INTERVAL '16 days'
  );

-- 8) Review slots (both participants per order)
-- For completed iPhone order: both reviewed already
INSERT INTO review_slots (order_id, product_id, reviewer_id, reviewee_id, reviewer_role, status, due_at, created_at) VALUES
  (
    (SELECT id FROM orders WHERE product_id = (SELECT id FROM products WHERE title='iPhone 13 128GB')),
    (SELECT id FROM products WHERE title='iPhone 13 128GB'),
    (SELECT id FROM users WHERE email='bob@example.com'),
    (SELECT seller_id FROM products WHERE title='iPhone 13 128GB'),
    'BUYER',
    'REVIEWED',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '16 days'
  ),
  (
    (SELECT id FROM orders WHERE product_id = (SELECT id FROM products WHERE title='iPhone 13 128GB')),
    (SELECT id FROM products WHERE title='iPhone 13 128GB'),
    (SELECT seller_id FROM products WHERE title='iPhone 13 128GB'),
    (SELECT id FROM users WHERE email='bob@example.com'),
    'SELLER',
    'REVIEWED',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '16 days'
  );

-- For open orders: create pending slots (buyer and seller)
-- XPS PENDING
INSERT INTO review_slots (order_id, product_id, reviewer_id, reviewee_id, reviewer_role, status, due_at)
VALUES
  (
    (SELECT id FROM orders WHERE product_id = (SELECT id FROM products WHERE title='Dell XPS 13 2022')),
    (SELECT id FROM products WHERE title='Dell XPS 13 2022'),
    (SELECT id FROM users WHERE email='dave@example.com'),
    (SELECT seller_id FROM products WHERE title='Dell XPS 13 2022'),
    'BUYER', 'PENDING', NOW() + INTERVAL '10 days'
  ),
  (
    (SELECT id FROM orders WHERE product_id = (SELECT id FROM products WHERE title='Dell XPS 13 2022')),
    (SELECT id FROM products WHERE title='Dell XPS 13 2022'),
    (SELECT seller_id FROM products WHERE title='Dell XPS 13 2022'),
    (SELECT id FROM users WHERE email='dave@example.com'),
    'SELLER', 'PENDING', NOW() + INTERVAL '10 days'
  );

-- MacBook SHIPPED
INSERT INTO review_slots (order_id, product_id, reviewer_id, reviewee_id, reviewer_role, status, due_at)
VALUES
  (
    (SELECT id FROM orders WHERE product_id = (SELECT id FROM products WHERE title='MacBook Air M1 16GB/512GB')),
    (SELECT id FROM products WHERE title='MacBook Air M1 16GB/512GB'),
    (SELECT id FROM users WHERE email='erin@example.com'),
    (SELECT seller_id FROM products WHERE title='MacBook Air M1 16GB/512GB'),
    'BUYER', 'PENDING', NOW() + INTERVAL '7 days'
  ),
  (
    (SELECT id FROM orders WHERE product_id = (SELECT id FROM products WHERE title='MacBook Air M1 16GB/512GB')),
    (SELECT id FROM products WHERE title='MacBook Air M1 16GB/512GB'),
    (SELECT seller_id FROM products WHERE title='MacBook Air M1 16GB/512GB'),
    (SELECT id FROM users WHERE email='erin@example.com'),
    'SELLER', 'PENDING', NOW() + INTERVAL '7 days'
  );

-- Kindle PAID
INSERT INTO review_slots (order_id, product_id, reviewer_id, reviewee_id, reviewer_role, status, due_at)
VALUES
  (
    (SELECT id FROM orders WHERE product_id = (SELECT id FROM products WHERE title='Kindle Paperwhite')),
    (SELECT id FROM products WHERE title='Kindle Paperwhite'),
    (SELECT id FROM users WHERE email='bob@example.com'),
    (SELECT seller_id FROM products WHERE title='Kindle Paperwhite'),
    'BUYER', 'PENDING', NOW() + INTERVAL '6 days'
  ),
  (
    (SELECT id FROM orders WHERE product_id = (SELECT id FROM products WHERE title='Kindle Paperwhite')),
    (SELECT id FROM products WHERE title='Kindle Paperwhite'),
    (SELECT seller_id FROM products WHERE title='Kindle Paperwhite'),
    (SELECT id FROM users WHERE email='bob@example.com'),
    'SELLER', 'PENDING', NOW() + INTERVAL '6 days'
  );

-- 9) Review appends (追评) - add-on to buyer's iPhone review
INSERT INTO order_review_appends (review_id, comment, created_at)
VALUES
  (
    (SELECT id FROM order_reviews
       WHERE order_id = (SELECT id FROM orders WHERE product_id = (SELECT id FROM products WHERE title='iPhone 13 128GB'))
         AND reviewer_id = (SELECT id FROM users WHERE email='bob@example.com')
       LIMIT 1),
    'After 2 weeks: still works perfectly.',
    NOW() - INTERVAL '14 days'
  );

-- 10) Conversations & Messages
-- Create a conversation for the iPhone product between buyer and seller
INSERT INTO conversations (product_id, created_at) VALUES
  ((SELECT id FROM products WHERE title='iPhone 13 128GB'), NOW() - INTERVAL '19 days');

-- Participants
INSERT INTO conversation_participants (conversation_id, user_id, joined_at) VALUES
  (
    (SELECT id FROM conversations WHERE product_id = (SELECT id FROM products WHERE title='iPhone 13 128GB')),
    (SELECT id FROM users WHERE email='bob@example.com'),
    NOW() - INTERVAL '19 days'
  ),
  (
    (SELECT id FROM conversations WHERE product_id = (SELECT id FROM products WHERE title='iPhone 13 128GB')),
    (SELECT seller_id FROM products WHERE title='iPhone 13 128GB'),
    NOW() - INTERVAL '19 days'
  );

-- Messages
INSERT INTO messages (conversation_id, sender_id, body_text, is_read, sent_at) VALUES
  (
    (SELECT id FROM conversations WHERE product_id = (SELECT id FROM products WHERE title='iPhone 13 128GB')),
    (SELECT id FROM users WHERE email='bob@example.com'),
    'Hi, is this still available?',
    FALSE,
    NOW() - INTERVAL '19 days'
  ),
  (
    (SELECT id FROM conversations WHERE product_id = (SELECT id FROM products WHERE title='iPhone 13 128GB')),
    (SELECT seller_id FROM products WHERE title='iPhone 13 128GB'),
    'Yes, it is. Battery health is 92%.',
    TRUE,
    NOW() - INTERVAL '19 days'
  );

-- 11) Email verification tokens (explicit UUIDs)
INSERT INTO email_verification_tokens (id, user_id, token, created_at, expires_at, used_at) VALUES
  ('890a7cd0-58fb-4b2d-8516-7c6ad597dd50', (SELECT id FROM users WHERE email='bob@example.com'),   'verify-bob-1',   NOW() - INTERVAL '44 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '43 days'),
  ('dafb1861-5c9d-404f-b616-17e495e2c285', (SELECT id FROM users WHERE email='erin@example.com'),  'verify-erin-1',  NOW() - INTERVAL '9 days',  NOW() + INTERVAL '1 day',   NULL),
  ('ea437c07-a658-4555-a1f8-b6682ea19d87', (SELECT id FROM users WHERE email='frank@example.com'), 'verify-frank-1', NOW() - INTERVAL '4 days',  NOW() + INTERVAL '3 days',  NULL),
  ('791d0316-e468-4da3-aab5-f6079425ee36', (SELECT id FROM users WHERE email='alice@example.com'), 'verify-alice-1', NOW() - INTERVAL '59 days', NOW() - INTERVAL '29 days', NOW() - INTERVAL '58 days');

-- 12) Password reset tokens (store token_hash, not plaintext)
INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used, created_at, used_at) VALUES
  (
    (SELECT id FROM users WHERE email='carol@example.com'),
    'hash_carol_reset_1',
    NOW() + INTERVAL '2 hours',
    FALSE,
    NOW() - INTERVAL '1 hour',
    NULL
  ),
  (
    (SELECT id FROM users WHERE email='alice@example.com'),
    'hash_alice_reset_1',
    NOW() - INTERVAL '1 hour',
    TRUE,
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '1 hour'
  );

COMMIT;

-- End of SEED
