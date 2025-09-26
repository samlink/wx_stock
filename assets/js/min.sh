#!/bin/sh

# 增量构建脚本 - 只在源文件比目标文件新时才重新构建

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

# 构建 tools_service.js (合并多个文件)
TOOLS_SERVICE_SOURCES="./parts/proto_tools.js ./parts/tools.js ./parts/alert.js ./parts/notifier.js ./parts/autocomplete.js ./parts/modal.js ./parts/tree.js ./parts/table.js ./parts/table_class.js ./parts/service.js ./parts/edit_table.js ./parts/customer.js ./pages/functions.js"
TOOLS_SERVICE_TARGET="../../static/tools_service.js"

if needs_rebuild "$TOOLS_SERVICE_TARGET" $TOOLS_SERVICE_SOURCES; then
    echo "构建 tools_service.js..."
    terser $TOOLS_SERVICE_SOURCES -c -o "$TOOLS_SERVICE_TARGET"
    echo "✓ tools_service.js 构建完成"
else
    echo "⏭ tools_service.js 无需重新构建"
fi

# 构建单个页面文件
build_single_file() {
    local source="$1"
    local target="$2"
    local name="$3"

    if needs_rebuild "$target" "$source"; then
        echo "构建 $name..."
        terser "$source" -c -o "$target"
        echo "✓ $name 构建完成"
    else
        echo "⏭ $name 无需重新构建"
    fi
}

# 构建各个页面文件
build_single_file "./pages/login.js" "../../static/login.js" "login.js"
build_single_file "./pages/base.js" "../../static/base.js" "base.js"
build_single_file "./pages/productset.js" "../../static/productset.js" "productset.js"
build_single_file "./pages/userset.js" "../../static/userset.js" "userset.js"

echo "构建完成！"

