# CLAUDE.md - AI Assistant Guide for wx-stock Project

> 本文档为 AI 助手（如 Claude）提供项目深度指导，帮助理解项目架构、开发流程和最佳实践。

## 📋 项目概览

**wx-stock** 是为五星(天津)石油装备有限公司开发的库存管理系统，采用 Rust + Actix-web 后端和原生 JavaScript 前端的技术栈。

### 核心业务功能
- 📦 **商品管理**: 物料号、规格型号、材质、库存长度/重量管理
- 🌲 **分类树**: 递归树形结构的商品分类体系
- 🛒 **购物车**: 用户购物车管理和订单提交
- 📋 **订单管理**: 用户订单查询和待处理订单统计
- 📊 **数据导出**: Excel 格式的库存数据导出
- 🌐 **多语言**: 中英文双语支持（localStorage 存储语言偏好）

---

## 🚀 快速开始

### 开发环境命令

```bash
# 启动开发服务器（自动构建前端 + 启动 Rust 服务）
./run.sh

# 仅构建前端资源（增量编译）
./scripts/build.sh

# 监听模式（自动检测文件变化并重新构建）
./scripts/build.sh --watch

# 强制重新构建所有前端资源
./scripts/build.sh --force
```

### 生产环境部署

```bash
# 交叉编译到 FreeBSD 并自动部署到远程服务器
./build.sh
```

### 本地开发调试技巧

1. **自动登录设置**（开发时）：
   在 `assets/js/pages/login.js` 开头取消注释：
   ```javascript
   setCookie("wxok", "ok", 3);
   localStorage.setItem('language', 'zh');
   ```

2. **环境变量配置**：
   创建 `.env` 文件设置数据库连接：
   ```env
   port=8087
   PG__HOST=localhost
   PG__PORT=5432
   PG__USER=postgres
   PG__PASSWORD=your_password
   PG__DBNAME=sales
   ```

3. **数据库准备**：
   确保 PostgreSQL 运行且 `sales` 数据库存在

---

## 🏗️ 项目架构详解

### 后端架构 (Rust + Actix-web)

#### 核心模块说明

| 模块 | 文件 | 职责 |
|------|------|------|
| **路由处理** | `src/html.rs` | HTML 页面路由、静态文件服务、用户认证检查 |
| **商品管理** | `src/product.rs` | 商品查询、筛选、统计、Excel 导出 |
| **购物车** | `src/cart.rs` | 购物车增删改查、订单提交 |
| **订单管理** | `src/orders.rs` | 用户订单查询、订单详情、待处理订单统计 |
| **分类树** | `src/tree.rs` | 递归树形结构管理、自动完成搜索 |
| **用户认证** | `src/user_set.rs` | 登录/登出、密码修改、失败次数限制 |
| **通用服务** | `src/service.rs` | 数据库工具、Excel 生成、翻译服务 |
| **信息查询** | `src/information.rs` | 公告信息查询 |
| **构建脚本** | `src/build.rs` | Ructe 模板编译、静态文件嵌入 |

#### 关键技术特性

1. **编译时模板系统 (Ructe)**
   - 模板在编译时转换为 Rust 代码
   - 零运行时模板解析开销
   - 类型安全的模板参数
   - 静态文件自动嵌入到二进制文件

2. **异步数据库连接池 (deadpool-postgres)**
   - 自动连接管理和复用
   - 异步非阻塞操作
   - 配置通过环境变量注入

3. **Cookie 身份验证**
   - Cookie 名称: `auth-guest`
   - 有效期: 30 天
   - 存储用户名（非加密，内网环境）

4. **数据传输格式**
   - 使用自定义分隔符 `<`*_*`>` (SPLITER) 拼接字段
   - 前端通过 `split()` 解析数据

### 前端架构 (Vanilla JavaScript + SASS)

#### 目录结构

```
assets/js/
├── parts/              # 可复用组件（模块化设计）
│   ├── proto_tools.js  # 原型扩展工具
│   ├── tools.js        # 通用工具函数
│   ├── alert.js        # 警告框组件
│   ├── notifier.js     # 通知组件
│   ├── modal.js        # 模态框组件
│   ├── table.js        # 表格组件（旧版）
│   ├── table_class.js  # 表格类组件（新版）
│   ├── tree.js         # 树形组件
│   ├── autocomplete.js # 自动完成组件
│   ├── cart.js         # 购物车管理器
│   ├── orders.js       # 订单管理器
│   ├── service.js      # 业务服务函数
│   ├── translator.js   # 翻译服务
│   ├── edit_table.js   # 可编辑表格
│   └── customer.js     # 客户管理
└── pages/              # 页面特定脚本
    ├── login.js        # 登录页面
    ├── base.js         # 基础页面（所有页面共用）
    ├── productset.js   # 商品管理页面
    ├── cartpage.js     # 购物车页面
    ├── myorders.js     # 我的订单页面
    ├── userset.js      # 用户设置页面
    └── functions.js    # 通用函数库

scss/
├── base/               # 基础样式
│   ├── _variables.scss # 变量定义
│   ├── _header.scss    # 头部样式
│   ├── _footer.scss    # 底部样式
│   ├── _body.scss      # 主体样式
│   ├── _button.scss    # 按钮样式
│   ├── _form.scss      # 表单样式
│   └── ...
├── pages/              # 页面特定样式
│   ├── _productset.scss
│   ├── _cart.scss
│   ├── _orders.scss
│   └── _userset.scss
├── parts/              # 组件样式
│   ├── _table.scss
│   ├── _modal.scss
│   ├── _tree.scss
│   └── ...
├── login.scss          # 登录页面样式（独立）
└── sales.scss          # 主应用样式（合并所有）
```

#### JavaScript 模块化模式

使用 **IIFE (立即执行函数表达式)** 实现模块化：

```javascript
var MyModule = function() {
    // 私有变量和函数
    let privateVar = 'hidden';
    function privateFunction() { /* ... */ }

    // 公共接口
    return {
        publicMethod: function() { /* ... */ },
        publicVar: 'visible'
    };
}();
```

#### 前端构建系统

**增量编译机制**：
- 比较源文件和目标文件的修改时间戳
- 只重新构建已修改的文件
- SASS 依赖检测（检查 `_*.scss` 文件）

**构建流程**：
1. JavaScript: 合并 → Terser 压缩 → 输出到 `static/`
2. SASS: 编译 → 压缩 → 输出到 `static/`

**关键构建目标**：
- `tools_service.js`: 合并所有 parts 和 functions.js
- `base.js`, `login.js`, `productset.js`, `cart_page.js`, `myorders.js`, `userset.js`: 独立页面脚本
- `sales.css`: 主应用样式
- `login.css`: 登录页面样式

---

## 🗄️ 数据库架构

### 核心数据表

#### 1. **products** (商品表 - ERP 共享)
```sql
-- 关键字段（中文字段名）
物料号 TEXT PRIMARY KEY
规格型号 TEXT
商品id TEXT  -- 关联 tree.num
文本字段2 TEXT  -- 状态
文本字段3 TEXT  -- 执行标准
文本字段4 TEXT  -- 炉批号
文本字段5 TEXT  -- 生产厂家
文本字段10 TEXT  -- 炉号（关联 lu.炉号）
单号id TEXT  -- 关联 documents.单号
备注 TEXT
作废 BOOLEAN
```

#### 2. **tree** (分类树表)
```sql
num TEXT PRIMARY KEY  -- 分类编号
node_name TEXT  -- 节点名称（格式: "材质 名称"）
parent TEXT  -- 父节点编号
```

#### 3. **shopping_cart** (购物车表)
```sql
id SERIAL PRIMARY KEY
user_id INTEGER  -- 关联 customers.id
material_number TEXT  -- 关联 products.物料号
quantity INTEGER DEFAULT 1
added_at TIMESTAMP
updated_at TIMESTAMP
UNIQUE (user_id, material_number)
```

#### 4. **orders** (订单表)
```sql
id SERIAL PRIMARY KEY
order_id VARCHAR(50) UNIQUE  -- 订单号
user_id INTEGER  -- 关联 customers.id
status VARCHAR(20) DEFAULT 'pending'
created_at TIMESTAMP
updated_at TIMESTAMP
```

#### 5. **order_items** (订单明细表)
```sql
id SERIAL PRIMARY KEY
order_id VARCHAR(50)  -- 关联 orders.order_id
material_number VARCHAR(50)  -- 关联 products.物料号
quantity INTEGER DEFAULT 1
created_at TIMESTAMP
```

#### 6. **customers** (用户表)
```sql
id SERIAL PRIMARY KEY
username TEXT UNIQUE
password TEXT  -- MD5 加密
名称 TEXT  -- 公司名称
failed INTEGER DEFAULT 0  -- 登录失败次数
get_pass INTEGER  -- 密码修改权限
```

#### 7. **mv_length_weight** (库存视图/物化视图)
```sql
物料号 TEXT
库存长度 INTEGER  -- 单位: mm
理论重量 NUMERIC  -- 单位: kg
```

### 数据库查询模式

**参数化查询**（防止 SQL 注入）：
```rust
let rows = conn.query(
    "SELECT * FROM products WHERE 物料号 = $1",
    &[&material_number]
).await?;
```

**动态 SQL 构建**：
```rust
let sql = format!(
    "SELECT {} FROM products WHERE {} ORDER BY {} LIMIT {}",
    fields, conditions, sort, limit
);
```

---

## 🛣️ API 路由完整列表

所有路由都在 `/stock/` 前缀下：

### 页面路由 (GET)
| 路由 | 处理函数 | 说明 | 认证 |
|------|---------|------|------|
| `/` | `html::home` | 商品管理主页 | ✅ |
| `/login` | `html::login` | 登录页面 | ❌ |
| `/user_set` | `html::user_set` | 用户设置页面 | ✅ |
| `/cart` | `html::cart` | 购物车页面 | ✅ |
| `/myorders` | `html::myorders` | 我的订单页面 | ✅ |
| `/logout` | `user_set::logout` | 退出登录 | ✅ |

### 商品相关 API (POST)
| 路由 | 处理函数 | 说明 |
|------|---------|------|
| `/fetch_product` | `product::fetch_product` | 获取商品列表（分页、筛选、排序） |
| `/fetch_statistic` | `product::fetch_statistic` | 获取库存统计信息 |
| `/fetch_filter_items` | `product::fetch_filter_items` | 获取筛选器选项 |
| `/product_out` | `product::product_out` | 导出商品数据到 Excel |

### 分类树 API (POST/GET)
| 路由 | 处理函数 | 说明 |
|------|---------|------|
| `/tree` | `tree::tree` | 获取完整分类树 |
| `/tree_auto` | `tree::tree_auto` | 自动完成搜索 |

### 购物车 API (POST)
| 路由 | 处理函数 | 说明 |
|------|---------|------|
| `/add_to_cart` | `cart::add_to_cart` | 添加商品到购物车 |
| `/get_cart_count` | `cart::get_cart_count` | 获取购物车商品数量 |
| `/get_cart_materials` | `cart::get_cart_materials` | 获取购物车物料号列表 |
| `/get_cart_items` | `cart::get_cart_items` | 获取购物车商品列表 |
| `/get_cart_detail` | `cart::get_cart_detail` | 获取购物车详细信息 |
| `/remove_from_cart` | `cart::remove_from_cart` | 从购物车移除商品 |
| `/clear_cart` | `cart::clear_cart` | 清空购物车 |
| `/submit_order` | `cart::submit_order` | 提交订单 |

### 订单 API (POST)
| 路由 | 处理函数 | 说明 |
|------|---------|------|
| `/get_user_orders` | `orders::get_user_orders` | 获取用户订单列表 |
| `/get_order_details` | `orders::get_order_details` | 获取订单详情 |
| `/get_pending_orders_count` | `orders::get_pending_orders_count` | 获取待处理订单数量 |

### 用户认证 API (POST)
| 路由 | 处理函数 | 说明 |
|------|---------|------|
| `/login` | `user_set::login` | 用户登录 |
| `/change_pass` | `user_set::change_pass` | 修改密码 |

---

## 💡 开发最佳实践

### 修改前端代码流程

1. **修改 JavaScript/SCSS 源文件**
   ```bash
   vim assets/js/parts/service.js
   # 或
   vim scss/base/_header.scss
   ```

2. **增量构建**
   ```bash
   ./scripts/build.sh
   ```

3. **测试验证**
   - 刷新浏览器查看效果
   - 检查浏览器控制台是否有错误

4. **提交代码**
   ```bash
   git add .
   git commit -m "feat: 添加新功能"
   ```

### 修改后端代码流程

1. **修改 Rust 源码**
   ```bash
   vim src/product.rs
   ```

2. **编译检查**
   ```bash
   cargo check
   cargo test  # 如果有测试
   ```

3. **运行服务**
   ```bash
   ./run.sh
   ```

4. **生产构建**
   ```bash
   cargo build --release
   ```

### 添加新 API 端点

1. **在相应模块定义处理函数**
   ```rust
   #[post("/new_endpoint")]
   pub async fn new_endpoint(
       db: web::Data<Pool>,
       data: web::Json<RequestData>,
       id: Identity
   ) -> HttpResponse {
       // 验证用户
       let user_name = id.identity().unwrap_or("".to_owned());
       if user_name == "" {
           return HttpResponse::Unauthorized().finish();
       }

       // 业务逻辑
       let conn = db.get().await.unwrap();
       // ...

       HttpResponse::Ok().json(response_data)
   }
   ```

2. **在 main.rs 注册路由**
   ```rust
   .service(module_name::new_endpoint)
   ```

### 添加新前端组件

1. **创建组件文件**
   ```bash
   vim assets/js/parts/my_component.js
   ```

2. **使用 IIFE 模式**
   ```javascript
   var MyComponent = function() {
       function init() { /* 初始化 */ }
       function render() { /* 渲染 */ }

       return { init, render };
   }();
   ```

3. **在构建脚本中包含**
   - `parts/` 目录下的文件会自动包含到 `tools_service.js`
   - 页面特定脚本放在 `pages/` 目录

### 数据库迁移

1. **备份数据**
   ```bash
   pg_dump sales > backup_$(date +%Y%m%d).sql
   ```

2. **执行 SQL 变更**
   ```sql
   ALTER TABLE products ADD COLUMN new_field VARCHAR(100);
   ```

3. **更新相关代码**
   - 修改 Rust 结构体
   - 更新 SQL 查询
   - 调整前端显示

4. **测试验证**

---

## 🎨 前端开发注意事项

### 多语言支持

**语言切换机制**：
- 语言偏好存储在 `localStorage.getItem('language')`
- 默认值: `'zh'` (中文)
- 支持值: `'zh'` (中文) / `'en'` (英文)

**实现方式**：
```javascript
const lang = localStorage.getItem('language') || 'zh';
if (lang == "en") {
    document.querySelector('#title').textContent = 'English Title';
}
```

### 表格组件使用

**旧版表格** (`table.js`):
```javascript
tool_table.table_init(init_data);
tool_table.fetch_table(callback);
```

**新版表格类** (`table_class.js`):
```javascript
const table = new TableClass(container, config);
table.fetchData();
```

### 模态框使用

```javascript
tool_modal.modal_init({
    title: '标题',
    body: '<p>内容</p>',
    submit_fn: function() {
        // 提交逻辑
    }
});
tool_modal.modal_show();
```

### 通知组件

```javascript
notifier.show('操作成功', 'success');  // success, danger, warning, info
```

---

## 📦 依赖管理

### Rust 依赖 (Cargo.toml)

**核心依赖**:
- `actix-web = "4.7"` - Web 框架
- `tokio-postgres = "0.7.10"` - 异步 PostgreSQL 客户端
- `deadpool-postgres = "0.12.1"` - 连接池
- `serde = "1.0"` - 序列化/反序列化
- `rust_xlsxwriter = "0.84.0"` - Excel 生成
- `ructe` - 编译时模板引擎

### 前端依赖 (package.json)

**构建工具**:
- `terser = "^5.31.1"` - JavaScript 压缩

**系统依赖**:
- `dart-sass` - SASS 编译器（需全局安装）

---

## 🚢 部署说明

### FreeBSD 交叉编译

**前置条件**:
1. 安装 LLVM 和 LLD 链接器
2. 下载 FreeBSD sysroot 到 `/opt/freebsd-sysroot`
3. 添加 Rust 目标: `rustup target add x86_64-unknown-freebsd`

**执行部署**:
```bash
./build.sh
```

**部署流程**:
1. 交叉编译到 FreeBSD 目标
2. SCP 上传到远程服务器
3. SSH 执行部署脚本（备份旧版本、替换新版本、重启服务）

---

## 📚 技术栈总结

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **后端语言** | Rust | 1.70+ | 主要编程语言 |
| **Web 框架** | Actix-web | 4.7 | HTTP 服务器 |
| **数据库** | PostgreSQL | - | 数据存储 |
| **连接池** | deadpool-postgres | 0.12.1 | 数据库连接管理 |
| **模板引擎** | Ructe | - | 编译时 HTML 模板 |
| **认证** | actix-identity | 0.4 | Cookie 身份验证 |
| **Excel** | rust_xlsxwriter | 0.84.0 | Excel 文件生成 |
| **前端语言** | JavaScript | ES6+ | 客户端脚本 |
| **CSS 预处理** | SASS/SCSS | - | 样式表 |
| **构建工具** | Terser + Dart-Sass | - | 代码压缩和编译 |
| **运行时** | Tokio | - | 异步运行时 |

---

## 🎯 AI 助手工作提示

### 修改代码时的注意事项

1. **前端修改**:
   - 修改 `assets/js/` 或 `scss/` 源文件，**不要直接修改** `static/` 目录
   - 修改后必须运行 `./scripts/build.sh` 重新构建
   - 注意多语言支持，中英文都要处理

2. **后端修改**:
   - 遵循 Rust 命名规范（snake_case 函数，PascalCase 结构体）
   - 使用参数化查询防止 SQL 注入
   - 添加适当的错误处理（`unwrap()` 仅用于开发环境）

3. **数据库操作**:
   - 注意中文字段名（如 `物料号`、`规格型号`）
   - 使用 `作废 = false` 过滤已删除数据
   - 注意 `mv_length_weight` 视图的 LEFT JOIN

4. **模板修改**:
   - Ructe 模板使用 `@` 符号嵌入 Rust 代码
   - 修改模板后需要重新编译 Rust 代码
   - 模板文件: `templates/*.rs.html`

5. **样式修改**:
   - 使用 SCSS 变量（定义在 `scss/base/_variables.scss`）
   - 遵循 BEM 命名规范
   - 注意响应式设计

6. **构建和部署**:
   - 本地开发使用 `./run.sh`
   - 生产构建使用 `cargo build --release`
   - 部署到 FreeBSD 服务器使用 `./build.sh`，其他任务禁止运行此脚本

### 常用代码模式

**获取用户信息**:
```rust
let user = get_user(&db, id).await;
if user.username == "" {
    return goto_login();
}
```

**数据库查询**:
```rust
let conn = db.get().await.unwrap();
let rows = conn.query(sql, &[&param1, &param2]).await.unwrap();
```

**JSON 响应**:
```rust
HttpResponse::Ok().json(json!({
    "success": true,
    "data": data
}))
```

**前端 Fetch 请求**:
```javascript
fetch('/stock/api_endpoint', {
    method: 'POST',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
})
.then(response => response.json())
.then(content => {
    // 处理响应
});
```

---

## 📖 相关文档

- **AGENTS.md**: 更详细的开发者指南和架构分析
- **README.md**: 项目概述和快速开始
