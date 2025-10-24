-- 修复 order_items 表缺失的字段
-- Fix missing columns in order_items table
-- Date: 2025-01-XX
-- Issue: 购物车提交订单时出现服务器错误

-- 添加 quantity 字段（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='order_items' AND column_name='quantity'
    ) THEN
        ALTER TABLE order_items ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1;
        RAISE NOTICE 'Added quantity column to order_items table';
    ELSE
        RAISE NOTICE 'quantity column already exists in order_items table';
    END IF;
END $$;

-- 添加 created_at 字段（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='order_items' AND column_name='created_at'
    ) THEN
        ALTER TABLE order_items ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added created_at column to order_items table';
    ELSE
        RAISE NOTICE 'created_at column already exists in order_items table';
    END IF;
END $$;

-- 验证表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'order_items'
ORDER BY ordinal_position;
