-- =====================================================================
-- KoalaSwap Image Storage Migration v1.4 (完整版)
-- 目标：为现有的 product_images 表添加 S3 + CloudFront 支持
-- 保持向后兼容，逐步迁移到云存储
-- 包含：数据修复 + 结构升级 + 功能增强
-- =====================================================================

BEGIN;

-- 检查依赖（确保基础表已存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_images') THEN
        RAISE EXCEPTION 'product_images 表不存在，请先执行基础 schema 脚本';
    END IF;
    RAISE NOTICE '开始执行图片存储迁移...';
END $$;

-- 0) 数据修复：解决重复 display_order 问题
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- 检查重复数据情况
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

        -- 重新分配排序号，确保唯一性
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

-- 1) 为 product_images 表添加云存储相关字段
-- 注意：保留原有 image_url 字段，用于存储完整的 CDN URL
ALTER TABLE product_images
    ADD COLUMN IF NOT EXISTS object_key TEXT,                    -- S3对象键，如: product/uuid/timestamp-filename.jpg
    ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE,   -- 是否为商品主图（第一张图）
    ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0,        -- 显示顺序（替代原 sort_order 的语义）
    ADD COLUMN IF NOT EXISTS file_size BIGINT,                   -- 文件大小（字节）
    ADD COLUMN IF NOT EXISTS original_name VARCHAR(255),         -- 用户上传时的原始文件名
    ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100),             -- 文件MIME类型，如: image/jpeg, image/png
    ADD COLUMN IF NOT EXISTS upload_status VARCHAR(20) DEFAULT 'COMPLETED', -- 上传状态: UPLOADING, COMPLETED, FAILED
    ADD COLUMN IF NOT EXISTS uploaded_by UUID,                   -- 上传者（通常是商品发布者）
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(); -- 更新时间

-- 2) 添加外键约束：uploaded_by -> users(id)
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

-- 3) 创建更新时间戳的触发器（沿用项目现有的函数）
DROP TRIGGER IF EXISTS trg_touch_product_images_updated_at ON product_images;
CREATE TRIGGER trg_touch_product_images_updated_at
    BEFORE UPDATE ON product_images
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

-- 4) 数据迁移：在创建唯一索引前先设置正确的值
DO $$
BEGIN
    RAISE NOTICE '开始数据迁移...';

    -- 步骤1：重新分配 display_order，基于现有的 sort_order 和创建时间
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

    -- 步骤2：为未设置上传状态的记录设置默认值
    UPDATE product_images
    SET upload_status = 'COMPLETED'
    WHERE upload_status IS NULL;

    -- 步骤3：将每个商品的第一张图片设为主图（基于新的 display_order）
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

-- 5) 创建索引，适配新的查询模式（在数据迁移之后）
-- 删除旧的唯一约束（因为我们现在用 display_order 替代 sort_order）
ALTER TABLE product_images DROP CONSTRAINT IF EXISTS uq_product_image_sort;

-- 新增复合唯一约束：同一商品的图片不能有相同的显示顺序
CREATE UNIQUE INDEX IF NOT EXISTS uq_product_image_display_order
    ON product_images (product_id, display_order)
    WHERE upload_status = 'COMPLETED';

-- 为主图查询优化
CREATE INDEX IF NOT EXISTS idx_product_images_primary
    ON product_images (product_id, is_primary)
    WHERE is_primary = TRUE AND upload_status = 'COMPLETED';

-- 为图片列表查询优化
CREATE INDEX IF NOT EXISTS idx_product_images_list
    ON product_images (product_id, display_order, upload_status);

-- 为S3对象键查询优化
CREATE INDEX IF NOT EXISTS idx_product_images_object_key
    ON product_images (object_key)
    WHERE object_key IS NOT NULL;

-- 6) 创建辅助函数：自动维护主图状态
CREATE OR REPLACE FUNCTION fn_maintain_primary_image() RETURNS TRIGGER AS $$
BEGIN
    -- 如果新插入/更新的图片被设为主图，取消同一商品的其他主图
    IF NEW.is_primary = TRUE AND NEW.upload_status = 'COMPLETED' THEN
        UPDATE product_images
        SET is_primary = FALSE
        WHERE product_id = NEW.product_id
          AND id != NEW.id
          AND is_primary = TRUE;
    END IF;

    -- 如果当前主图被删除或失效，自动选择下一张图片作为主图
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

-- 应用主图维护触发器
DROP TRIGGER IF EXISTS trg_maintain_primary_image ON product_images;
CREATE TRIGGER trg_maintain_primary_image
    AFTER INSERT OR UPDATE OR DELETE ON product_images
    FOR EACH ROW EXECUTE FUNCTION fn_maintain_primary_image();

-- 7) 添加约束确保数据完整性
-- 确保上传状态只能是指定值
ALTER TABLE product_images
    ADD CONSTRAINT chk_upload_status
    CHECK (upload_status IN ('UPLOADING', 'COMPLETED', 'FAILED'));

-- 确保完成上传的图片必须有 image_url
ALTER TABLE product_images
    ADD CONSTRAINT chk_completed_must_have_url
    CHECK (upload_status != 'COMPLETED' OR (image_url IS NOT NULL AND image_url != ''));

-- 确保有 object_key 的图片必须有文件大小
ALTER TABLE product_images
    ADD CONSTRAINT chk_object_key_must_have_size
    CHECK (object_key IS NULL OR file_size > 0);

-- 8) 创建视图，简化常用查询
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

-- 9) 创建专门查询主图的视图
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

-- =====================================================================
-- 迁移完成提示与验证
-- =====================================================================
DO $$
DECLARE
    total_images INTEGER;
    total_products INTEGER;
    primary_images INTEGER;
BEGIN
    -- 获取统计信息
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