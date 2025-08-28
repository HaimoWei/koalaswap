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






-- =====================================================================
-- KoalaSwap Chat Schema Upgrade (Compat with v1.2 + v1.3_extra)
-- 目标：在你现有 DB（已执行 v1.2 与 v1.3_extra）上，增补聊天微服务
--      所需的类型/列/外键/索引，且与“目标版 DDL”业务效果完全等效。
-- 风格：保持 v1.2 的 TIMESTAMP、gen_random_uuid、fn_touch_updated_at 等约定。
-- =====================================================================

-- 0) 依赖（v1.2 已建，这里再确保一次）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) 新增聊天相关枚举 ----------------------------------------------------
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

-- 2) conversations：增补所需列/外键/索引 --------------------------------
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

-- 外键：order_id -> orders(id) ON DELETE SET NULL
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

-- 外键：buyer/seller/started_by -> users(id)
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

-- 外键：last_message_id -> messages(id)
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

-- 唯一性：product_id + buyer_id + seller_id（仅当三者有值）
CREATE UNIQUE INDEX IF NOT EXISTS uq_conv_unique_triplet
    ON conversations (product_id, buyer_id, seller_id)
    WHERE buyer_id IS NOT NULL AND seller_id IS NOT NULL;

-- 常用索引（与目标版等效；方向不敏感）
CREATE INDEX IF NOT EXISTS idx_conversations_buyer
    ON conversations (buyer_id, last_message_at);
CREATE INDEX IF NOT EXISTS idx_conversations_seller
    ON conversations (seller_id, last_message_at);
CREATE INDEX IF NOT EXISTS idx_conversations_updated
    ON conversations (updated_at);

-- 更新时间戳触发器（沿用 v1.2 的通用函数）
DROP TRIGGER IF EXISTS trg_touch_conversations_updated_at ON conversations;
CREATE TRIGGER trg_touch_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

-- 3) conversation_participants：增补“我的视图状态” -----------------------
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

-- 外键：last_read_message_id -> messages(id)
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

-- 索引：按用户列出会话
CREATE INDEX IF NOT EXISTS idx_conv_part_user
    ON conversation_participants (user_id, updated_at);

-- 更新时间戳触发器
DROP TRIGGER IF EXISTS trg_touch_conv_part_updated_at ON conversation_participants;
CREATE TRIGGER trg_touch_conv_part_updated_at
    BEFORE UPDATE ON conversation_participants
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

-- 4) messages：增补新消息字段并回填旧数据 -------------------------------
ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS type          message_type NOT NULL DEFAULT 'TEXT',
    ADD COLUMN IF NOT EXISTS body          TEXT,
    ADD COLUMN IF NOT EXISTS image_url     TEXT,
    ADD COLUMN IF NOT EXISTS system_event  system_event,
    ADD COLUMN IF NOT EXISTS meta          JSONB,
    ADD COLUMN IF NOT EXISTS created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS deleted_at    TIMESTAMP;

-- 一次性回填：body <- body_text；created_at <- sent_at
UPDATE messages
SET body = COALESCE(body, body_text)
WHERE body IS NULL;

UPDATE messages
SET created_at = COALESCE(created_at, sent_at)
WHERE created_at IS NULL;

-- 索引：会话时间顺序拉取（避免与 v1.2 的 idx_messages_conv_time 冲突）
CREATE INDEX IF NOT EXISTS idx_messages_conv_created_at
    ON messages (conversation_id, created_at);

-- 5) （可选）触发器骨架（应用层已维护未读与快照，这里默认关闭）
-- -- CREATE OR REPLACE FUNCTION trg_after_message_insert() RETURNS TRIGGER AS $$
-- -- BEGIN
-- --   UPDATE conversations
-- --     SET last_message_id = NEW.id,
-- --         last_message_at = COALESCE(NEW.created_at, NOW()),
-- --         last_message_preview =
-- --           (CASE NEW.type
-- --              WHEN 'TEXT'   THEN left(coalesce(NEW.body,''), 120)
-- --              WHEN 'IMAGE'  THEN '[图片]'
-- --              WHEN 'SYSTEM' THEN '[系统] ' || coalesce(NEW.system_event::text, '')
-- --            END),
-- --         updated_at = NOW()
-- --   WHERE id = NEW.conversation_id;
-- --   RETURN NEW;
-- -- END $$ LANGUAGE plpgsql;
-- -- DROP TRIGGER IF EXISTS after_message_insert ON messages;
-- -- CREATE TRIGGER after_message_insert
-- --   AFTER INSERT ON messages
-- --   FOR EACH ROW EXECUTE FUNCTION trg_after_message_insert();

-- =====================================================================
-- 说明：
-- - 时间列统一用 TIMESTAMP，与 v1.2 脚本风格一致；业务上与 TIMESTAMPTZ 等效使用。
-- - 不删除任何旧列（如 body_text/sent_at/is_read），确保旧逻辑不受影响。
-- - 三元组唯一性通过部分唯一索引实现，对历史空 buyer/seller 记录安全。
-- - 若后续需要把 buyer_id/seller_id/started_by 收敛为 NOT NULL，可在数据回填完毕后另加约束。
-- =====================================================================




BEGIN;

-- 1) 若存在旧的基于 sent_at 的索引，先删除（v1.2 常见命名）
DROP INDEX IF EXISTS idx_messages_conv_time;

-- 2) 如果之前我们创建过兼容索引 idx_messages_conv_created_at，则把它重命名为目标名；
--    否则就创建一个目标名的索引（基于 created_at）。
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

-- 3) 删除从未使用过的旧列
ALTER TABLE messages
    DROP COLUMN IF EXISTS body_text,
    DROP COLUMN IF EXISTS sent_at,
    DROP COLUMN IF EXISTS is_read;

COMMIT;
