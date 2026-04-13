#!/bin/bash

# ========================================
# 下载 Python 3.7 兼容的依赖包
# ========================================

echo "========================================"
echo "下载 Python 3.7 兼容的依赖包"
echo "========================================"
echo ""

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "✗ 错误: 未找到 python3"
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "当前 Python 版本: $PYTHON_VERSION"
echo ""

# 创建依赖包目录
echo "步骤 1: 清理旧的离线包..."
rm -rf offline-packages
mkdir -p offline-packages

echo "✓ 目录已创建"
echo ""

# 下载 Python 3.7 兼容的依赖包
echo "步骤 2: 下载依赖包（Python 3.7 兼容版本）..."
echo ""

# 检测目标平台
echo "目标平台: manylinux (通用 Linux)"
echo "Python 版本: 3.7"
echo ""

# 方法 1: 使用 requirements.txt（推荐）
if [ -f "api/requirements.txt" ]; then
    echo "使用 api/requirements.txt 下载..."
    
    # 为 Python 3.7 和 manylinux 平台下载
    # 使用 --platform 和 --python-version 确保兼容性
    pip3 download --no-cache-dir \
        --platform manylinux2014_x86_64 \
        --platform manylinux_2_17_x86_64 \
        --platform manylinux1_x86_64 \
        --python-version 37 \
        --only-binary=:all: \
        -r api/requirements.txt \
        -d offline-packages/
    
    if [ $? -ne 0 ]; then
        echo ""
        echo "✗ 使用 requirements.txt 下载失败，尝试手动下载..."
        echo ""
        
        # 方法 2: 手动指定每个包
        echo "手动下载各个包..."
        # 手动下载每个包，指定平台
        echo "手动下载各个包（manylinux 平台）..."
        pip3 download --no-cache-dir --platform manylinux2014_x86_64 --python-version 37 --only-binary=:all: Flask==2.0.3 -d offline-packages/
        pip3 download --no-cache-dir --platform manylinux2014_x86_64 --python-version 37 --only-binary=:all: flask-cors==3.0.10 -d offline-packages/
        pip3 download --no-cache-dir --platform manylinux2014_x86_64 --python-version 37 --only-binary=:all: psycopg2-binary==2.9.6 -d offline-packages/
        pip3 download --no-cache-dir --platform manylinux2014_x86_64 --python-version 37 --only-binary=:all: python-dotenv==0.19.2 -d offline-packages/
        pip3 download --no-cache-dir --platform manylinux2014_x86_64 --python-version 37 --only-binary=:all: Werkzeug==2.0.3 -d offline-packages/
        pip3 download --no-cache-dir --platform manylinux2014_x86_64 --python-version 37 --only-binary=:all: itsdangerous==2.0.1 -d offline-packages/
        pip3 download --no-cache-dir --platform manylinux2014_x86_64 --python-version 37 --only-binary=:all: click==8.0.4 -d offline-packages/
        pip3 download --no-cache-dir --platform manylinux2014_x86_64 --python-version 37 --only-binary=:all: Jinja2==3.0.3 -d offline-packages/
        pip3 download --no-cache-dir --platform manylinux2014_x86_64 --python-version 37 --only-binary=:all: MarkupSafe==2.0.1 -d offline-packages/
        pip3 download --no-cache-dir --platform manylinux2014_x86_64 --python-version 37 --only-binary=:all: importlib-metadata==4.8.3 -d offline-packages/
        pip3 download --no-cache-dir --platform manylinux2014_x86_64 --python-version 37 --only-binary=:all: zipp==3.6.0 -d offline-packages/
        pip3 download --no-cache-dir --platform manylinux2014_x86_64 --python-version 37 --only-binary=:all: typing-extensions==4.1.1 -d offline-packages/
    fi
else
    echo "✗ 未找到 api/requirements.txt"
    exit 1
fi

echo ""
echo "步骤 3: 验证下载的包..."
echo ""

# 检查关键包
REQUIRED_PACKAGES=(
    "Flask-2.0.3"
    "flask_cors-3.0.10"
    "psycopg2_binary-2.9.6"
    "python_dotenv-0.19.2"
    "Werkzeug-2.0.3"
    "itsdangerous-2.0.1"
    "click-8.0.4"
    "Jinja2-3.0.3"
    "MarkupSafe-2.0.1"
    "importlib_metadata-4.8.3"
    "zipp-3.6.0"
    "typing_extensions-4.1.1"
)

MISSING_PACKAGES=()

for pkg in "${REQUIRED_PACKAGES[@]}"; do
    if ls offline-packages/${pkg}* 1> /dev/null 2>&1; then
        echo "✓ $pkg"
    else
        echo "✗ $pkg (缺失)"
        MISSING_PACKAGES+=("$pkg")
    fi
done

echo ""

if [ ${#MISSING_PACKAGES[@]} -gt 0 ]; then
    echo "⚠ 警告: 以下包缺失:"
    for pkg in "${MISSING_PACKAGES[@]}"; do
        echo "  - $pkg"
    done
    echo ""
    echo "这可能导致离线安装失败"
    echo ""
fi

echo "========================================"
echo "下载的所有包:"
echo "========================================"
ls -lh offline-packages/
echo ""
echo "总大小:"
du -sh offline-packages/
echo ""

# 检查是否有不兼容的版本
echo "========================================"
echo "检查版本兼容性"
echo "========================================"

if ls offline-packages/itsdangerous-2.2.* 1> /dev/null 2>&1; then
    echo "✗ 警告: 检测到 itsdangerous 2.2.x (需要 Python 3.8+)"
    echo "  请删除并重新下载 2.0.1 版本"
fi

if ls offline-packages/click-8.[3-9].* 1> /dev/null 2>&1; then
    echo "✗ 警告: 检测到 click 8.3+ (需要 Python 3.10+)"
    echo "  请删除并重新下载 8.0.4 版本"
fi

echo ""
echo "✓ 依赖包下载完成！"
echo ""

# 创建离线部署包
echo "========================================"
echo "创建离线部署包"
echo "========================================"

tar -czf python-packages-py37.tar.gz offline-packages/

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ 离线包创建完成: python-packages-py37.tar.gz"
    echo ""
    ls -lh python-packages-py37.tar.gz
    echo ""
    echo "========================================"
    echo "下一步："
    echo "========================================"
    echo "1. 将 python-packages-py37.tar.gz 传输到目标服务器"
    echo ""
    echo "   使用 scp:"
    echo "   scp python-packages-py37.tar.gz user@server:/path/to/dateQuality/"
    echo ""
    echo "   或使用 U盘/共享文件夹等方式"
    echo ""
    echo "2. 在目标服务器上解压:"
    echo "   tar -xzf python-packages-py37.tar.gz"
    echo ""
    echo "3. 运行安装脚本:"
    echo "   ./install-offline.sh"
    echo ""
    echo "========================================"
else
    echo "✗ 离线包创建失败"
    exit 1
fi
