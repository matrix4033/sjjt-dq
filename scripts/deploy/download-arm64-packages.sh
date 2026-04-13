#!/bin/bash

# ========================================
# 下载 ARM64 (aarch64) Python 依赖包
# ========================================

echo "========================================"
echo "下载 ARM64 Python 依赖包"
echo "========================================"
echo ""

# 创建目录
mkdir -p offline-packages-arm64

echo "当前机器架构: $(uname -m)"
echo ""

# 下载 ARM64 兼容的包
echo "步骤 1: 下载 ARM64 Python 3.7 兼容包..."
echo ""

# 为 ARM64 + Python 3.7 下载包
pip3 download --no-cache-dir \
    --platform manylinux2014_aarch64 \
    --platform manylinux_2_17_aarch64 \
    --python-version 37 \
    --only-binary=:all: \
    -r api/requirements.txt \
    -d offline-packages-arm64/

if [ $? -ne 0 ]; then
    echo ""
    echo "⚠ 部分包下载失败，尝试手动下载..."
    echo ""
    
    # 手动下载每个包
    pip3 download --no-cache-dir --platform manylinux2014_aarch64 --python-version 37 --only-binary=:all: Flask==2.0.3 -d offline-packages-arm64/
    pip3 download --no-cache-dir --platform manylinux2014_aarch64 --python-version 37 --only-binary=:all: flask-cors==3.0.10 -d offline-packages-arm64/
    pip3 download --no-cache-dir --platform manylinux2014_aarch64 --python-version 37 --only-binary=:all: psycopg2-binary==2.9.6 -d offline-packages-arm64/
    pip3 download --no-cache-dir --platform manylinux2014_aarch64 --python-version 37 --only-binary=:all: python-dotenv==0.19.2 -d offline-packages-arm64/
    pip3 download --no-cache-dir --platform manylinux2014_aarch64 --python-version 37 --only-binary=:all: Werkzeug==2.0.3 -d offline-packages-arm64/
    pip3 download --no-cache-dir --platform manylinux2014_aarch64 --python-version 37 --only-binary=:all: itsdangerous==2.0.1 -d offline-packages-arm64/
    pip3 download --no-cache-dir --platform manylinux2014_aarch64 --python-version 37 --only-binary=:all: click==8.0.4 -d offline-packages-arm64/
    pip3 download --no-cache-dir --platform manylinux2014_aarch64 --python-version 37 --only-binary=:all: Jinja2==3.0.3 -d offline-packages-arm64/
    pip3 download --no-cache-dir --platform manylinux2014_aarch64 --python-version 37 --only-binary=:all: MarkupSafe==2.0.1 -d offline-packages-arm64/
    pip3 download --no-cache-dir --platform manylinux2014_aarch64 --python-version 37 --only-binary=:all: importlib-metadata==4.8.3 -d offline-packages-arm64/
    pip3 download --no-cache-dir --platform manylinux2014_aarch64 --python-version 37 --only-binary=:all: zipp==3.6.0 -d offline-packages-arm64/
    pip3 download --no-cache-dir --platform manylinux2014_aarch64 --python-version 37 --only-binary=:all: typing-extensions==4.1.1 -d offline-packages-arm64/
fi

echo "✓ 依赖包下载完成"

echo ""
echo "步骤 2: 检查下载的包..."
PACKAGE_COUNT=$(ls offline-packages-arm64/*.whl 2>/dev/null | wc -l)
TAR_COUNT=$(ls offline-packages-arm64/*.tar.gz 2>/dev/null | wc -l)

echo "找到 $PACKAGE_COUNT 个 wheel 包"
echo "找到 $TAR_COUNT 个源码包"
echo ""

# 列出所有包
echo "包列表:"
ls -lh offline-packages-arm64/
echo ""

# 检查是否有二进制依赖
echo "步骤 3: 检查包类型..."
for file in offline-packages-arm64/*.whl; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        if [[ $filename == *"none-any"* ]]; then
            echo "✓ $filename (纯 Python，兼容所有架构)"
        elif [[ $filename == *"aarch64"* ]] || [[ $filename == *"arm64"* ]]; then
            echo "✓ $filename (ARM64 专用)"
        elif [[ $filename == *"x86_64"* ]] || [[ $filename == *"amd64"* ]]; then
            echo "⚠ $filename (x86_64 架构，ARM64 不兼容！)"
        else
            echo "? $filename (未知架构)"
        fi
    fi
done

echo ""
echo "步骤 4: 打包..."
tar -czf python-packages-arm64.tar.gz offline-packages-arm64/

if [ $? -eq 0 ]; then
    echo "✓ 打包完成"
    ls -lh python-packages-arm64.tar.gz
else
    echo "✗ 打包失败"
    exit 1
fi

echo ""
echo "========================================"
echo "✓ ARM64 离线包准备完成！"
echo "========================================"
echo ""
echo "文件: python-packages-arm64.tar.gz"
echo "大小: $(du -sh python-packages-arm64.tar.gz | cut -f1)"
echo ""
echo "下一步:"
echo "1. 传输到 ARM64 服务器:"
echo "   scp python-packages-arm64.tar.gz user@arm-server:/tmp/"
echo ""
echo "2. 在 ARM64 服务器上解压:"
echo "   tar -xzf python-packages-arm64.tar.gz"
echo "   mv offline-packages-arm64 offline-packages"
echo ""
echo "3. 运行安装脚本:"
echo "   chmod +x install-arm64-offline.sh"
echo "   ./install-arm64-offline.sh"
echo ""
echo "========================================"
