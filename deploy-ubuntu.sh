#!/bin/bash

set -e

echo "========================================"
echo "Ubuntu 自动部署脚本"
echo "数据汇聚情况周报系统 - PostgreSQL 版本"
echo "========================================"
echo ""

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo "请使用 sudo 运行此脚本"
    echo "用法: sudo ./deploy-ubuntu.sh"
    exit 1
fi

# 获取实际用户
ACTUAL_USER=${SUDO_USER:-$USER}
PROJECT_DIR="/opt/data-center"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "部署用户: $ACTUAL_USER"
echo "项目目录: $PROJECT_DIR"
echo ""

# 询问是否继续
read -p "是否继续部署? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "部署已取消"
    exit 0
fi

echo ""
echo "========================================"
echo "步骤 1: 更新系统"
echo "========================================"
apt update
echo "✓ 系统更新完成"

echo ""
echo "========================================"
echo "步骤 2: 安装 PostgreSQL"
echo "========================================"
if ! command -v psql &> /dev/null; then
    echo "正在安装 PostgreSQL..."
    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
    echo "✓ PostgreSQL 安装完成"
else
    echo "✓ PostgreSQL 已安装"
    psql --version
fi

echo ""
echo "========================================"
echo "步骤 3: 安装 Python 和开发工具"
echo "========================================"
apt install -y python3 python3-pip python3-venv python3-dev libpq-dev build-essential
echo "✓ Python 和开发工具安装完成"
python3 --version

echo ""
echo "========================================"
echo "步骤 4: 创建项目目录"
echo "========================================"
if [ "$SCRIPT_DIR" != "$PROJECT_DIR" ]; then
    echo "正在复制项目文件到 $PROJECT_DIR..."
    mkdir -p $PROJECT_DIR
    cp -r $SCRIPT_DIR/* $PROJECT_DIR/
    chown -R $ACTUAL_USER:$ACTUAL_USER $PROJECT_DIR
    cd $PROJECT_DIR
    echo "✓ 项目文件已复制"
else
    echo "✓ 已在项目目录中"
    cd $PROJECT_DIR
fi

echo ""
echo "========================================"
echo "步骤 5: 创建 Python 虚拟环境"
echo "========================================"
if [ -d "api/venv" ]; then
    echo "删除旧的虚拟环境..."
    rm -rf api/venv
fi

echo "创建新的虚拟环境..."
sudo -u $ACTUAL_USER python3 -m venv api/venv
echo "✓ 虚拟环境创建完成"

echo ""
echo "========================================"
echo "步骤 6: 安装 Python 依赖"
echo "========================================"
echo "升级 pip..."
sudo -u $ACTUAL_USER api/venv/bin/pip install --upgrade pip -q

echo "安装依赖包..."
sudo -u $ACTUAL_USER api/venv/bin/pip install -r api/requirements.txt -q

echo "验证安装..."
sudo -u $ACTUAL_USER api/venv/bin/python -c "import flask; print('✓ Flask:', flask.__version__)"
sudo -u $ACTUAL_USER api/venv/bin/python -c "import psycopg2; print('✓ psycopg2:', psycopg2.__version__)"
sudo -u $ACTUAL_USER api/venv/bin/python -c "import flask_cors; print('✓ flask-cors: 已安装')"

echo ""
echo "========================================"
echo "步骤 7: 配置数据库"
echo "========================================"

# 检查数据库是否存在
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='data_center'")

if [ "$DB_EXISTS" = "1" ]; then
    echo "⚠ 数据库 data_center 已存在"
    read -p "是否删除并重新创建? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo -u postgres psql -c "DROP DATABASE data_center;"
        sudo -u postgres psql -c "CREATE DATABASE data_center;"
        echo "✓ 数据库已重新创建"
    else
        echo "✓ 使用现有数据库"
    fi
else
    echo "创建数据库..."
    sudo -u postgres psql -c "CREATE DATABASE data_center;"
    echo "✓ 数据库创建完成"
fi

echo ""
echo "========================================"
echo "步骤 8: 创建配置文件"
echo "========================================"
if [ ! -f api/.env ]; then
    if [ -f api/.env.example ]; then
        cp api/.env.example api/.env
        chown $ACTUAL_USER:$ACTUAL_USER api/.env
        chmod 600 api/.env
        echo "✓ 配置文件已创建: api/.env"
        echo ""
        echo "⚠ 重要: 请编辑 api/.env 文件配置数据库密码"
        echo "   nano $PROJECT_DIR/api/.env"
    else
        echo "⚠ 警告: 未找到 api/.env.example"
    fi
else
    echo "✓ 配置文件已存在"
fi

echo ""
echo "========================================"
echo "步骤 9: 初始化数据库表结构"
echo "========================================"
if [ -f setup-database-postgresql.sql ]; then
    sudo -u postgres psql -d data_center -f setup-database-postgresql.sql
    echo "✓ 数据库表结构创建完成"
else
    echo "⚠ 警告: 未找到 setup-database-postgresql.sql"
fi

echo ""
echo "========================================"
echo "步骤 10: 导入数据"
echo "========================================"
if [ -f data/汇总.csv ] && [ -f data/明细.csv ]; then
    echo "正在导入 CSV 数据..."
    sudo -u $ACTUAL_USER api/venv/bin/python import-csv-to-postgresql.py
    echo "✓ 数据导入完成"
else
    echo "⚠ 警告: 未找到 CSV 数据文件"
    echo "   请手动导入数据: python3 import-csv-to-postgresql.py"
fi

echo ""
echo "========================================"
echo "步骤 11: 设置脚本权限"
echo "========================================"
chmod +x start-backend.sh start-frontend.sh start-all.sh stop-all.sh 2>/dev/null || true
echo "✓ 脚本权限设置完成"

echo ""
echo "========================================"
echo "步骤 12: 验证部署"
echo "========================================"

# 获取服务器 IP
SERVER_IP=$(hostname -I | awk '{print $1}')

echo "测试数据库连接..."
if sudo -u postgres psql -d data_center -c "SELECT COUNT(*) FROM hz;" > /dev/null 2>&1; then
    HZ_COUNT=$(sudo -u postgres psql -d data_center -tAc "SELECT COUNT(*) FROM hz;")
    MX_COUNT=$(sudo -u postgres psql -d data_center -tAc "SELECT COUNT(*) FROM mx;")
    echo "✓ 数据库连接成功"
    echo "  汇总表记录数: $HZ_COUNT"
    echo "  明细表记录数: $MX_COUNT"
else
    echo "⚠ 数据库连接测试失败"
fi

echo ""
echo "========================================"
echo "部署完成！"
echo "========================================"
echo ""
echo "📋 部署信息:"
echo "  项目目录: $PROJECT_DIR"
echo "  Python 版本: $(python3 --version)"
echo "  PostgreSQL 版本: $(psql --version | head -n1)"
echo "  服务器 IP: $SERVER_IP"
echo ""
echo "🚀 启动服务:"
echo "  cd $PROJECT_DIR"
echo "  ./start-all.sh"
echo ""
echo "🌐 访问地址:"
echo "  前端: http://$SERVER_IP:8000"
echo "  API: http://$SERVER_IP:5000/api/health"
echo ""
echo "⚙️ 可选配置:"
echo "  1. 编辑配置: nano $PROJECT_DIR/api/.env"
echo "  2. 安装为系统服务: sudo $PROJECT_DIR/install-systemd-service.sh"
echo "  3. 配置 Nginx: 参考 $PROJECT_DIR/nginx/data-center.conf"
echo ""
echo "📚 文档:"
echo "  Ubuntu部署指南.md"
echo "  PostgreSQL部署指南.md"
echo ""
echo "========================================"
