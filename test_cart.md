# 购物车功能测试指南

## 功能概述

已成功实现完整的购物车系统，包含以下功能：

### 后端API接口
- ✅ `/stock/get_cart_detail` - 获取购物车详细信息
- ✅ `/stock/remove_from_cart` - 删除购物车商品
- ✅ `/stock/update_cart_quantity` - 更新商品数量
- ✅ `/stock/clear_cart` - 清空购物车
- ✅ `/stock/submit_order` - 提交订单

### 前端页面功能
- ✅ 购物车详情页面 (`/stock/cart`)
- ✅ 响应式表格布局
- ✅ 商品数量实时修改
- ✅ 删除商品确认对话框
- ✅ 清空购物车确认对话框
- ✅ 订单提交成功对话框
- ✅ 总价统计和汇总

### 数据库支持
- ✅ 订单表 (`orders`)
- ✅ 订单详情表 (`order_items`)
- ✅ 购物车表 (`shopping_cart`) - 已存在

## 测试步骤

### 1. 访问商品页面
1. 打开浏览器访问 `http://localhost:8087/stock/`
2. 登录系统
3. 选择商品分类，浏览商品列表
4. 点击"添加到购物车"按钮添加商品

### 2. 访问购物车页面
1. 点击页面右上角的购物车图标
2. 系统将跳转到购物车页面 (`/stock/cart`)
3. 查看购物车中的商品列表

### 3. 测试购物车功能
1. **修改数量**：使用数量控制按钮或直接输入数字
2. **删除商品**：点击"删除"按钮，确认删除对话框
3. **清空购物车**：点击"清空购物车"按钮，确认清空对话框
4. **提交订单**：点击"提交订购"按钮

### 4. 验证功能
- ✅ 表格显示与productset页面一致的商品信息
- ✅ 数量修改实时更新小计和总价
- ✅ 删除操作有二次确认
- ✅ 清空操作有二次确认
- ✅ 提交订单后显示订单号
- ✅ 提交成功后购物车被清空

## 技术实现

### 后端架构
- **Rust + Actix-web**：高性能异步Web框架
- **PostgreSQL**：关系型数据库
- **事务处理**：确保数据一致性
- **库存检查**：提交订单前验证库存

### 前端架构
- **原生JavaScript**：无框架依赖，轻量级
- **响应式设计**：支持移动端和桌面端
- **模块化组件**：可复用的UI组件
- **动画效果**：提升用户体验

### 数据库设计
```sql
-- 订单表
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 订单详情表
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    material_number VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 文件结构

```
wx_stock/
├── src/
│   ├── cart.rs              # 购物车后端API
│   ├── html.rs              # 页面路由处理
│   └── main.rs              # 主程序入口
├── templates/
│   └── cart.rs.html         # 购物车页面模板
├── assets/js/
│   ├── pages/cart.js        # 购物车页面逻辑
│   └── parts/cart.js        # 购物车管理器
├── scss/pages/
│   └── _cart.scss           # 购物车页面样式
└── static/
    ├── cart_page.js         # 编译后的购物车页面JS
    └── sales.css            # 编译后的样式文件
```

## 注意事项

1. **数据库初始化**：首次使用前需要执行 `setup_orders.sql` 创建订单相关表
2. **权限控制**：所有API都需要用户登录验证
3. **库存检查**：提交订单时会验证库存是否充足
4. **事务处理**：订单提交使用数据库事务确保数据一致性
5. **错误处理**：完善的错误处理和用户提示

## 扩展功能

未来可以考虑添加的功能：
- 订单历史查询
- 订单状态跟踪
- 批量操作
- 购物车持久化（跨会话）
- 商品推荐
- 优惠券系统
