#!/bin/sh

# 统一构建脚本 - JavaScript 和 SASS 增量编译
# 使用方法：
#   ./scripts/build.sh          # 增量构建
#   ./scripts/build.sh --watch  # 监听模式
#   ./scripts/build.sh --force  # 强制重新构建

# 检查文件是否需要重新构建的函数
needs_rebuild() {
    local target="$1"
    shift
    local sources="$@"

    # 如果目标文件不存在，需要构建
    if [ ! -f "$target" ]; then
        return 0
    fi

    # 检查任何源文件是否比目标文件新
    for source in $sources; do
        if [ "$source" -nt "$target" ]; then
            return 0
        fi
    done

    # 不需要重新构建
    return 1
}

# 检查 SASS 文件是否需要重新构建
needs_rebuild_sass() {
    local scss_file="$1"
    local css_file="$2"
    
    # 如果 CSS 文件不存在，需要构建
    if [ ! -f "$css_file" ]; then
        return 0
    fi
    
    # 检查 SCSS 文件是否比 CSS 文件新
    if [ "$scss_file" -nt "$css_file" ]; then
        return 0
    fi
    
    # 检查所有依赖的 SCSS 文件
    local scss_dir=$(dirname "$scss_file")
    for dep_file in "$scss_dir"/_*.scss "$scss_dir"/base/_*.scss "$scss_dir"/pages/_*.scss "$scss_dir"/parts/_*.scss; do
        if [ -f "$dep_file" ] && [ "$dep_file" -nt "$css_file" ]; then
            return 0
        fi
    done
    
    return 1
}

# 构建单个 JavaScript 文件
build_single_js() {
    local source="$1"
    local target="$2"
    local name="$3"

    if [ "$FORCE_BUILD" = "1" ] || needs_rebuild "$target" "$source"; then
        echo "构建 $name..."
        terser "$source" -c -o "$target"
        echo "✓ $name 构建完成"
    else
        echo "⏭ $name 无需重新构建"
    fi
}

# 构建单个 SASS 文件
build_single_sass() {
    local source="$1"
    local target="$2"
    local name="$3"

    if [ "$FORCE_BUILD" = "1" ] || needs_rebuild_sass "$source" "$target"; then
        echo "构建 $name..."
        sass --style=compressed "$source" "$target" --no-source-map
        echo "✓ $name 构建完成"
    else
        echo "⏭ $name 无需重新构建"
    fi
}

# 构建所有 JavaScript 文件
build_javascript() {
    echo "=== 构建 JavaScript 文件 ==="
    
    # 切换到 JavaScript 源码目录
    cd assets/js
    
    # 构建 tools_service.js (合并多个文件)
    TOOLS_SERVICE_SOURCES="./parts/proto_tools.js ./parts/tools.js ./parts/alert.js ./parts/notifier.js ./parts/autocomplete.js ./parts/modal.js ./parts/tree.js ./parts/table.js ./parts/table_class.js ./parts/service.js ./parts/edit_table.js ./parts/customer.js ./parts/orders.js ./pages/functions.js"
    TOOLS_SERVICE_TARGET="../../static/tools_service.js"

    if [ "$FORCE_BUILD" = "1" ] || needs_rebuild "$TOOLS_SERVICE_TARGET" $TOOLS_SERVICE_SOURCES; then
        echo "构建 tools_service.js..."
        terser $TOOLS_SERVICE_SOURCES -c -o "$TOOLS_SERVICE_TARGET"
        echo "✓ tools_service.js 构建完成"
    else
        echo "⏭ tools_service.js 无需重新构建"
    fi

    # 构建各个页面文件
    build_single_js "./pages/login.js" "../../static/login.js" "login.js"
    build_single_js "./pages/base.js" "../../static/base.js" "base.js"
    build_single_js "./pages/productset.js" "../../static/productset.js" "productset.js"
    build_single_js "./pages/cartpage.js" "../../static/cart_page.js" "cart_page.js"
    build_single_js "./parts/cart.js" "../../static/cart.js" "cart.js"
    build_single_js "./pages/userset.js" "../../static/userset.js" "userset.js"
    build_single_js "./pages/myorders.js" "../../static/myorders.js" "myorders.js"
    
    # 回到项目根目录
    cd ../../
}

# 构建所有 SASS 文件
build_sass() {
    echo "=== 构建 SASS 文件 ==="
    
    # 构建各个 SASS 文件
    build_single_sass "scss/login.scss" "static/login.css" "login.css"
    build_single_sass "scss/sales.scss" "static/sales.css" "sales.css"
}

# 监听模式
watch_mode() {
    echo "=== 启动监听模式 ==="
    echo "正在监听文件变化... (按 Ctrl+C 退出)"
    
    # 启动 SASS 监听
    sass --watch --style=compressed scss/:static/ &
    SASS_PID=$!
    
    # JavaScript 文件监听循环
    while true; do
        build_javascript > /dev/null 2>&1
        sleep 2
    done &
    JS_PID=$!
    
    # 捕获 Ctrl+C 信号，清理子进程
    trap 'echo "正在停止监听..."; kill $SASS_PID $JS_PID 2>/dev/null; exit 0' INT
    
    # 等待
    wait
}

# 解析命令行参数
FORCE_BUILD=0
WATCH_MODE=0

for arg in "$@"; do
    case $arg in
        --force)
            FORCE_BUILD=1
            shift
            ;;
        --watch)
            WATCH_MODE=1
            shift
            ;;
        --help)
            echo "用法: $0 [选项]"
            echo "选项:"
            echo "  --force   强制重新构建所有文件"
            echo "  --watch   启动监听模式"
            echo "  --help    显示此帮助信息"
            exit 0
            ;;
        *)
            echo "未知选项: $arg"
            echo "使用 --help 查看可用选项"
            exit 1
            ;;
    esac
done

# 检查必要的工具
if ! command -v terser >/dev/null 2>&1; then
    echo "错误: 找不到 terser 命令。请安装: npm install -g terser"
    exit 1
fi

if ! command -v sass >/dev/null 2>&1; then
    echo "错误: 找不到 sass 命令。请安装: npm install -g sass"
    exit 1
fi

# 执行构建
if [ "$WATCH_MODE" = "1" ]; then
    watch_mode
else
    build_javascript
    build_sass
    echo "构建完成！"
fi