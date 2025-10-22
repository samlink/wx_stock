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