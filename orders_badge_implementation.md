# 订单角标功能实现

## 功能概述
在顶部导航栏的"我的订单"处添加了角标功能，显示未处理订单的数量，样式与购物车角标保持一致。

## 实现内容

### 1. 后端API实现
- **文件**: `src/orders.rs`
- **新增API**: `/stock/get_pending_orders_count`
- **功能**: 查询用户未处理订单数量（状态为'pending'的订单）
- **请求结构**: `PendingOrdersCountRequest`
- **响应结构**: `PendingOrdersCountResponse`

### 2. 路由配置
- **文件**: `src/main.rs`
- **新增路由**: `orders::get_pending_orders_count`

### 3. 前端模板修改
- **文件**: `templates/base.rs.html`
- **修改内容**: 
  - 将"我的订单"链接结构修改为包含角标的格式
  - 添加 `orders-icon-wrapper` 和 `orders-count` 元素

### 4. JavaScript功能实现
- **新文件**: `assets/js/parts/orders.js`
- **功能**: `OrdersManager` 类，管理订单角标的显示和更新
- **主要方法**:
  - `init()`: 初始化订单管理器
  - `getPendingOrdersCount()`: 获取未处理订单数量
  - `updateOrdersDisplay()`: 更新角标显示
  - `refreshOrdersCount()`: 刷新订单数量

### 5. 基础页面集成
- **文件**: `assets/js/pages/base.js`
- **修改内容**:
  - 初始化订单管理器
  - 修复英文翻译以保持角标结构

### 6. 订单页面集成
- **文件**: `assets/js/pages/myorders.js`
- **修改内容**: 在订单页面初始化时同时初始化订单角标管理器

### 7. 样式实现
- **文件**: `scss/parts/_cart.scss`
- **新增样式**:
  - `.orders-icon-wrapper`: 订单图标包装器
  - `#orders-count`: 订单角标样式
  - 动画效果: `ordersCountPulse`, `ordersCountClear`

### 8. 构建配置
- **文件**: `scripts/build.sh`
- **修改内容**: 将 `orders.js` 添加到 `tools_service.js` 的合并列表中

## 角标样式特点
- 与购物车角标保持一致的视觉效果
- 红色圆形背景 (`#dc3545`)
- 白色文字，居中显示
- 支持动画效果
- 响应式设计
- 支持无障碍访问

## 使用方式
1. 用户登录后，系统自动获取未处理订单数量
2. 如果有未处理订单，在"我的订单"右上角显示红色角标
3. 角标数字显示未处理订单的具体数量
4. 点击"我的订单"可跳转到订单页面查看详情

## 技术特点
- 异步加载，不阻塞页面渲染
- 错误处理完善，网络异常时优雅降级
- 支持多语言（中文/英文）
- 与现有购物车角标系统保持一致的架构
- 支持用户偏好设置（减少动画等）

## 数据库依赖
- 依赖 `orders` 表的 `status` 字段
- 查询条件: `status = 'pending'` 且 `user_id` 匹配当前用户

## 兼容性
- 向后兼容现有功能
- 不影响现有购物车角标功能
- 支持现代浏览器的所有特性