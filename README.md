# wx-stock - 五星石油库存管理系统

![Rust](https://img.shields.io/badge/Rust-1.70+-orange.svg)
![Actix-web](https://img.shields.io/badge/Actix--web-4.7-blue.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue.svg)
![License](https://img.shields.io/badge/License-Private-red.svg)

## 项目概述

wx-stock 是一个基于 Rust + Actix-web 开发的现代化库存管理系统，专为五星(天津)石油装备有限公司设计。系统提供了完整的商品库存管理、分类管理、数据统计和多语言支持功能。

## 核心功能

### 🏢 业务功能
- **商品管理**: 商品规格型号管理，支持物料号、规格、材质等多维度信息
- **库存管理**: 实时库存跟踪，包含库存长度、重量等详细信息
- **分类管理**: 树形结构的商品分类体系，支持动态增删改
- **统计分析**: 库存统计、出入库统计等数据分析功能
- **数据导出**: Excel 格式数据导出功能
- **多语言支持**: 中英文双语界面

### 🔐 系统功能
- **用户认证**: Cookie 身份验证，支持 30 天免登录
- **权限管理**: 基于用户的访问控制
- **数据筛选**: 高级筛选和搜索功能
- **响应式设计**: 支持多种屏幕尺寸的自适应布局

## 技术栈

### 后端技术
- **语言**: Rust 1.70+
- **Web框架**: Actix-web 4.7
- **数据库**: PostgreSQL
- **连接池**: deadpool-postgres
- **身份验证**: actix-identity
- **模板引擎**: ructe (编译时模板)
- **异步运行时**: Tokio

### 前端技术
- **JavaScript**: ES6+ 原生 JavaScript
- **CSS预处理器**: SASS/SCSS
- **构建工具**: 自定义构建脚本 (terser + sass)
- **UI组件**: 自定义组件库

### 开发工具
- **构建系统**: Cargo + 自定义脚本
- **代码压缩**: terser (JavaScript), sass (CSS)
- **版本控制**: Git

## 项目结构

```
wx-stock/
├── src/                    # Rust 源代码
│   ├── main.rs            # 应用入口点
│   ├── html.rs            # HTML 路由处理
│   ├── product.rs         # 商品相关业务逻辑
│   ├── service.rs         # 通用服务和工具函数
│   ├── tree.rs            # 树形结构管理
│   ├── user_set.rs        # 用户管理
│   ├── information.rs     # 信息查询
│   └── build.rs           # 构建脚本
├── templates/             # HTML 模板文件
│   ├── base.rs.html       # 基础模板
│   ├── login.rs.html      # 登录页面
│   ├── productset.rs.html # 商品管理页面
│   └── userset.rs.html    # 用户设置页面
├── assets/                # 静态资源
│   ├── js/                # JavaScript 源码
│   │   ├── parts/         # 可复用组件
│   │   └── pages/         # 页面特定脚本
│   ├── img/               # 图片资源
│   └── plugins/           # 第三方插件
├── scss/                  # SASS 样式源码
│   ├── base/              # 基础样式
│   ├── pages/             # 页面特定样式
│   └── parts/             # 组件样式
├── static/                # 编译后的静态文件
├── scripts/               # 构建和部署脚本
└── download/              # 下载文件目录
```

## 主要模块

### 1. 商品管理模块 (`product.rs`)
- 商品信息的增删改查
- 库存统计和分析
- 筛选条件管理
- 数据导出功能

### 2. 树形分类模块 (`tree.rs`)
- 递归树形结构管理
- 自动完成搜索
- 分类节点的动态加载

### 3. 用户管理模块 (`user_set.rs`)
- 用户登录/登出
- 密码修改
- 用户会话管理

### 4. 服务模块 (`service.rs`)
- 数据库连接管理
- Excel 文件生成
- 翻译服务集成
- 通用工具函数

### 5. 前端组件系统
- **表格组件**: 支持排序、分页、筛选的数据表格
- **树形组件**: 可展开/折叠的分类树
- **搜索组件**: 自动完成的搜索功能
- **模态框组件**: 通用的弹窗组件

## 开发环境设置

### 前置要求
- Rust 1.70+ 
- PostgreSQL 数据库
- Node.js (用于前端构建工具)
- terser 和 sass （前端构建）

### 环境配置
编辑 `.env` 文件：
```env
PG__HOST=127.0.0.1
PG__PORT=5432
PG__USER=postgres
PG__PASSWORD=your_password
PG__DBNAME=sales

company=五星(天津)石油装备有限公司
port=8087
start=2023-11-20

api_key=your_api_key
```

### 数据库
- 数据库 sales，与五星石油装备有限公司的 erp 共用

## 开发和运行

### 开发模式运行
```bash
# 构建并运行服务器
./run.sh

# 前端资源构建 (增量编译)（可选）
./scripts/build.sh

# 前端资源监听模式 （可选）
./scripts/build.sh --watch

# 强制重新构建前端资源 （可选）
./scripts/build.sh --force
```

### 生产环境构建
```bash
# 构建 Release 版本
cargo build --release

# 构建前端资源 （可选）
./scripts/build.sh --force
```

### 部署
```bash
# 上传到服务器
sh put.sh
```
- 远程服务器对应目录：wxstock

### 启动 （本地测试）
http://127.0.0.1:8087/stock/ 

## API 接口

### 主要端点
- `GET /stock/` - 主页面 (商品管理)
- `GET /stock/login` - 登录页面
- `GET /stock/user_set` - 用户设置页面
- `POST /stock/fetch_product` - 获取商品数据
- `GET /stock/tree` - 获取分类树数据
- `GET /stock/tree_auto` - 自动完成搜索
- `POST /stock/login` - 用户登录
- `POST /stock/logout` - 用户登出

## 开发注意事项

### 1. 本地测试运行
- 修改 login.js，去除最上面两句代码的注释：
``` rust
localStorage.setItem('language', 'zh'); // 'en' 为调试英文
```

### 2. static 目录为自动生成，无需修改

## 许可证

本项目为私有项目，版权归五星(天津)石油装备有限公司所有。

## 联系信息

- 开发者: sam <samlink@126.com>
- 公司: 天津炬瓴科技有限公司