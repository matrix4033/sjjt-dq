#!/bin/bash

# ========================================
# ARM64 (aarch64) 离线安装脚本
# ========================================

echo "========================================"
echo "ARM64 离线安装"
echo "数据汇聚情况周报系统"
echo "========================================"
echo ""

# 检查架构
ARCH=$(uname -m)
echo "当前架构: $ARCH"

if [ "$ARCH" != "aarch64" ] && [ "$ARCH" != "arm64" ]; then
    echo "⚠ 警告: 当前架构不是 ARM64"
    echo "此脚本专为 ARM64 (aarch64) 设计"
    echo ""
    read -p "是否继续? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
echo ""

# 检查系统信息
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo "操作系统: $NAME"
    echo "版本: $VERSION"
elif [ -f /etc/redhat-release ]; then
    echo "操作系统: $(cat /etc/redhat-release)"
fi
echo ""

# 检查内核
echo "内核版本: $(uname -r)"
echo ""

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "✗ 错误: 未找到 Python3"
    echo ""
    echo "安装方法:"
    echo "  sudo yum install python3"
    echo "  或"
    echo "  sudo dnf install python3"
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "Python 版本: $PYTHON_VERSION"
echo ""

# 检查离线包
OFFLINE_DIR="offline-packages"
if [ -d "offline-packages-arm64" ]; then
    OFFLINE_DIR="offline-packages-arm64"
fi

if [ ! -d "$OFFLINE_DIR" ]; then
    echo "✗ 错误: 未找到离线包目录"
    echo ""
    echo "请确保已解压:"
    echo "  tar -xzf python-packages-arm64.tar.gz"
    exit 1
fi

PACKAGE_COUNT=$(ls $OFFLINE_DIR/*.whl 2>/dev/null | wc -l)
echo "找到 $PACKAGE_COUNT 个依赖包"
echo ""

# 步骤 1: 创建虚拟环境
echo "步骤 1: 创建虚拟环境..."
if [ -d "api/venv" ]; then
    echo "删除旧的虚拟环境..."
    rm -rf api/venv
fi

python3 -m venv api/venv

if [ $? -ne 0 ]; then
    echo "✗ 虚拟环境创建失败"
    echo ""
    echo "可能需要安装:"
    echo "  sudo yum install python3-devel gcc"
    echo "  或"
    echo "  sudo dnf install python3-devel gcc"
    exit 1
fi

echo "✓ 虚拟环境创建成功"
echo ""

# 步骤 2: 安装依赖
echo "步骤 2: 安装依赖..."
source api/venv/bin/activate

# 升级 pip
if ls $OFFLINE_DIR/pip-*.whl 1> /dev/null 2>&1; then
    echo "升级 pip..."
    pip install --no-index --find-links=$OFFLINE_DIR/ --upgrade pip 2>/dev/null
fi

# 安装依赖
echo "从离线包安装依赖..."
pip install --no-index --find-links=$OFFLINE_DIR/ -r api/requirements.txt

if [ $? -ne 0 ]; then
    echo "⚠ 批量安装失败，尝试逐个安装核心依赖..."
    echo ""
    
    # 逐个安装
    for pkg in Flask pymysql python-dotenv Flask-Cors; do
        echo "安装 $pkg..."
        pip install --no-index --find-links=$OFFLINE_DIR/ $pkg
        if [ $? -ne 0 ]; then
            echo "⚠ $pkg 安装失败"
        fi
    done
fi

echo ""
echo "✓ 依赖安装完成"
echo ""

# 步骤 3: 验证安装
echo "步骤 3: 验证安装..."
python -c "import flask, pymysql, dotenv, flask_cors" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✓ 所有核心依赖验证通过"
    echo ""
    echo "已安装的包:"
    pip list | grep -E "Flask|pymysql|dotenv|Cors"
else
    echo "⚠ 依赖验证失败"
    echo ""
    echo "已安装的包:"
    pip list
    echo ""
    echo "请检查是否所有依赖都已正确安装"
fi

deactivate
echo ""

# 步骤 4: 设置权限
echo "步骤 4: 设置脚本权限..."
chmod +x start-backend.sh start-frontend.sh start-all.sh stop-all.sh 2>/dev/null
echo "✓ 权限设置完成"
echo ""

# 步骤 5: 检查配置
echo "步骤 5: 检查配置文件..."
if [ ! -f "api/.env" ]; then
    if [ -f "api/.env.example" ]; then
        echo "创建配置文件..."
        cp api/.env.example api/.env
        echo "✓ 已创建 api/.env"
    else
        echo "⚠ 未找到配置文件模板"
    fi
fi
echo ""

# 步骤 6: 系统检查
echo "步骤 6: 系统环境检查..."

# 检查 MySQL
if command -v mysql &> /dev/null; then
    echo "✓ MySQL 客户端已安装"
else
    echo "⚠ 未检测到 MySQL 客户端"
    echo "  安装: sudo yum install mysql"
fi

# 检查 MySQL 服务
if systemctl is-active --quiet mysqld 2>/dev/null; then
    echo "✓ MySQL 服务正在运行"
elif systemctl is-active --quiet mariadb 2>/dev/null; then
    echo "✓ MariaDB 服务正在运行"
else
    echo "⚠ MySQL/MariaDB 服务未运行"
    echo "  启动: sudo systemctl start mysqld"
fi

echo ""

echo "========================================"
echo "✓ ARM64 离线安装完成！"
echo "========================================"
echo ""
echo "系统信息:"
echo "  架构: $ARCH"
echo "  Python: $PYTHON_VERSION"
echo "  依赖包: $PACKAGE_COUNT 个"
echo ""
echo "下一步操作:"
echo ""
echo "1. 编辑数据库配置:"
echo "   vi api/.env"
echo "   (修改 DB_PASSWORD 等参数)"
echo ""
echo "2. 初始化数据库:"
echo "   mysql -u root -p < setup-database.sql"
echo ""
echo "3. 导入数据:"
echo "   api/venv/bin/python import-csv-to-mysql.py"
echo ""
echo "4. 启动服务:"
echo "   ./start-all.sh"
echo ""
echo "5. 访问系统:"
echo "   http://localhost:8000"
echo ""
echo "========================================"
