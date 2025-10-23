-- 购物车数据表创建脚本
-- 创建购物车表
CREATE TABLE shopping_cart (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    material_number TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_material FOREIGN KEY (material_number) REFERENCES products(物料号) ON DELETE CASCADE,
    CONSTRAINT unique_user_material UNIQUE (user_id, material_number)
);

-- 创建索引以提高查询性能
CREATE INDEX idx_shopping_cart_user_id ON shopping_cart(user_id);
CREATE INDEX idx_shopping_cart_material ON shopping_cart(material_number);

