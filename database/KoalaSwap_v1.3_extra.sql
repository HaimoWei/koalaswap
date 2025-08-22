-- === v1.3: product_status 状态机 & 兼容迁移 ===

-- 1) 新枚举类型（若不存在）
DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_status') THEN
            CREATE TYPE product_status AS ENUM ('ACTIVE','RESERVED','SOLD','HIDDEN');
        END IF;
    END $$;

-- 2) 新列（默认 ACTIVE）
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS status product_status NOT NULL DEFAULT 'ACTIVE';

-- 3) 兼容迁移：把历史 is_active 映射为 status
DO $$
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='products' AND column_name='is_active') THEN
            UPDATE products
            SET status = CASE WHEN is_active THEN 'ACTIVE'::product_status
                              ELSE 'HIDDEN'::product_status END;
        END IF;
    END $$;

-- 4) 删除旧列
DO $$
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='products' AND column_name='is_active') THEN
            ALTER TABLE products DROP COLUMN is_active;
        END IF;
    END $$;

-- 5) （可选）为状态检索加索引
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);



-- 删掉旧的 is_active 索引（若存在）
DROP INDEX IF EXISTS public.idx_products_active_created_at;
DROP INDEX IF EXISTS public.idx_products_active_price;

-- 然后移除旧列（会自动连带删除依赖索引；双保险）
ALTER TABLE public.products DROP COLUMN IF EXISTS is_active;
