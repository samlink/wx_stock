#!/bin/bash

# FreeBSD 交叉编译脚本 (Linux 和 macOS)

set -e

echo "=========================================="
echo "  FreeBSD 交叉编译"
echo "=========================================="
echo ""

echo "检查必要的工具..."

# Detect OS and set the appropriate build directory
if [ "$(uname)" = "Darwin" ]; then
    # macOS
    check_llvm="/opt/homebrew/opt/llvm/bin"
    check_lld="/opt/homebrew/opt/lld/bin"
else
    # Linux or other
    check_llvm="/usr/bin"
    check_lld="/usr/bin"
fi

message="请按“交叉编译/交叉编译说明.md”设置"

if ! command -v $check_llvm/clang &> /dev/null; then
    echo "错误: clang 未找到"
    echo $message
    exit 1
fi

if ! command -v $check_lld/ld.lld &> /dev/null; then
    echo "错误: LLD 链接器未找到"
    echo $message
    exit 1
fi

if [ ! -d "/opt/freebsd-sysroot" ]; then
    echo "错误: FreeBSD sysroot 未找到 (/opt/freebsd-sysroot)"
    echo $message
    exit 1
fi

if ! rustup target list --installed | grep -q "x86_64-unknown-freebsd"; then
    echo "错误: x86_64-unknown-freebsd 目标未安装"
    echo "请运行: rustup target add x86_64-unknown-freebsd"
    exit 1
fi

echo "✓ 所有必要的工具已就绪，开始编译..."
echo ""

# 在编译前，临时注释掉 login.js 中的本地测试代码，发布后再恢复
LOGIN_JS_SOURCE="assets/js/pages/login.js"
LOGIN_JS_BACKUP="assets/js/pages/login.js.bak_build"

comment_login_js() {
    if [ -f "$LOGIN_JS_SOURCE" ]; then
        cp "$LOGIN_JS_SOURCE" "$LOGIN_JS_BACKUP"
        echo "临时注释 login.js 中的 setCookie 与 language 设置..."
        if [ "$(uname)" = "Darwin" ]; then
            sed -i '' -E 's/^([[:space:]]*)setCookie\("wxok",[[:space:]]*"ok",[[:space:]]*3\);/\1\/\/ setCookie("wxok", "ok", 3);/' "$LOGIN_JS_SOURCE"
            sed -i '' -E "s/^([[:space:]]*)localStorage\.setItem\('language',[[:space:]]*'zh'\);([[:space:]]*\/\/ zh en)?/\1\/\/ localStorage.setItem('language', 'zh'); \/\/ zh en/" "$LOGIN_JS_SOURCE"
        else
            sed -i -E 's/^([[:space:]]*)setCookie\("wxok",[[:space:]]*"ok",[[:space:]]*3\);/\1\/\/ setCookie\("wxok", \"ok\", 3\);/' "$LOGIN_JS_SOURCE"
            sed -i -E "s/^([[:space:]]*)localStorage\.setItem\('language',[[:space:]]*'zh'\);([[:space:]]*\/\/ zh en)?/\1\/\/ localStorage.setItem\('language', 'zh'\); \/\/ zh en/" "$LOGIN_JS_SOURCE"
        fi
    fi
}

restore_login_js() {
    if [ -f "$LOGIN_JS_BACKUP" ]; then
        mv -f "$LOGIN_JS_BACKUP" "$LOGIN_JS_SOURCE"
        echo "已恢复 login.js 到原始状态"
    fi
}

trap 'restore_login_js' EXIT

# 先构建前端静态资源（确保 static/login.js 由注释后的源文件生成并被 embed）
comment_login_js
./scripts/build.sh
# 前端构建完成后立即恢复 login.js 原始内容
restore_login_js

cargo build --release --target x86_64-unknown-freebsd
BINARY_PATH="target/x86_64-unknown-freebsd/release/wx-stock"

echo ""
echo "=========================================="
echo "  编译成功！"
echo "=========================================="
echo ""
echo "二进制文件: $BINARY_PATH"
echo ""
echo "文件大小: $(ls -lh "$BINARY_PATH" | awk '{print $5}')"
echo "文件类型: $(file "$BINARY_PATH")"
echo ""

echo "开始发布到远程服务器..."

scp target/x86_64-unknown-freebsd/release/wx-stock sam@39.106.229.26:/home/sam
ssh -T sam@39.106.229.26 <<EOF > /dev/null 2>&1
mv /home/sam/wxstock/wx-stock /home/sam/wxstock/wx-stock.bak
mv /home/sam/wx-stock /home/sam/wxstock
cd wxstock
killall wx-stock
exit
EOF

echo "发布完成！"