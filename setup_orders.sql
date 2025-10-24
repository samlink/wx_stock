-- 创建订单表
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建订单详情表
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    material_number VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_material_number ON order_items(material_number);

-- 添加注释
COMMENT ON TABLE orders IS '订单表';
COMMENT ON TABLE order_items IS '订单详情表';
COMMENT ON COLUMN orders.order_id IS '订单号';
COMMENT ON COLUMN orders.user_id IS '用户ID';
COMMENT ON COLUMN orders.status IS '订单状态：pending-待处理，confirmed-已确认，shipped-已发货，delivered-已送达，cancelled-已取消';
COMMENT ON COLUMN order_items.material_number IS '物料号';
COMMENT ON COLUMN order_items.quantity IS '数量';
