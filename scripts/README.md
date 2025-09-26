# 构建脚本说明

## 概述

`build.sh` 是一个统一的构建脚本，合并了原来的 `assets/js/min.sh` 和 `scss/min.sh` 功能，支持 JavaScript 和 SASS 文件的增量编译。

## 使用方法

### 基本构建（增量编译）
```bash
./scripts/build.sh
```
只构建已修改的文件，提高构建效率。

### 强制重新构建
```bash
./scripts/build.sh --force
```
强制重新构建所有文件，忽略文件时间戳。

### 监听模式
```bash
./scripts/build.sh --watch
```
启动文件监听模式，自动检测文件变化并重新构建。按 `Ctrl+C` 退出。

### 帮助信息
```bash
./scripts/build.sh --help
```

## 功能特性

### JavaScript 构建
- **tools_service.js**: 合并多个 parts 和 pages 文件
- **单页面文件**: login.js, base.js, productset.js, userset.js
- **增量编译**: 只在源文件比目标文件新时才重新构建
- **压缩**: 使用 terser 进行代码压缩

### SASS 构建
- **增量编译**: 检查主文件和依赖文件的修改时间
- **依赖检测**: 自动检测 `_*.scss` 依赖文件的变化
- **压缩输出**: 生成压缩的 CSS 文件

## 构建目标

### JavaScript
- `assets/js/parts/*.js` + `assets/js/pages/functions.js` → `static/tools_service.js`
- `assets/js/pages/login.js` → `static/login.js`
- `assets/js/pages/base.js` → `static/base.js`
- `assets/js/pages/productset.js` → `static/productset.js`
- `assets/js/pages/userset.js` → `static/userset.js`

### SASS
- `scss/login.scss` → `static/login.css`
- `scss/sales.scss` → `static/sales.css`

## 依赖要求

- **terser**: JavaScript 压缩工具
  ```bash
  npm install -g terser
  ```

- **sass**: SASS 编译器
  ```bash
  npm install -g sass
  ```

## 旧脚本迁移

原来的构建脚本已被合并和替换：
- `assets/js/min.sh` → 已删除
- `scss/min.sh` → 已删除

新的统一脚本提供了更好的功能和用户体验。