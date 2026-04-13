#!/bin/bash

# ========================================
# Linux 部署脚本
# ========================================

echo "========================================"
echo "大数据中心数据汇聚情况周报系统"
echo "Linux 部署脚本"
echo "========================================"
echo ""

# 检查是否为 root 用户
if [ "$EUID" -eq 0 ]; then 
    echo "警告: 不建议使用 root 用户运行此脚本"
    read -p "是否继续? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 步骤 1: 检查系统依赖
echo "步骤 1: 检查系统依赖..."
echo ""

# 检查 Python3
if ! command -v python3 &> /dev/null; then
    echo "✗ Python3 未安装"
    echo "请运行: sudo apt-get install python3 python3-pip python3-venv"
    exit 1
else
    PYTHON_VERSION=$(python3 --version)
    echo "✓ $PYTHON_VERSION 已安装"
fi

# 检查 MySQL
if ! command -v mysql &> /dev/null; then
    echo "✗ MySQL 未安装"
    echo "请运行: sudo apt-get install mysql-server"
    exit 1
else
    MYSQL_VERSION=$(mysql --version)
    echo "✓ $MYSQL_VERSION 已安装"
fi

echo ""

# 步骤 2: 配置数据库
echo "步骤 2: 配置数据库..."
echo ""

read -p "是否需要初始化数据库? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "请输入 MySQL root 密码: " -s MYSQL_PASSWORD
    echo ""
    
    echo "创建数据库和表..."
    mysql -u root -p"$MYSQL_PASSWORD" < setup-database.sql
    
    if [ $? -eq 0 ]; then
        echo "✓ 数据库初始化成功"
    else
        echo "✗ 数据库初始化失败"
        exit 1
    fi
    
    echo ""
    read -p "是否需要导入 CSV 数据? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "导入数据..."
        python3 import-csv-to-mysql.py
        
        if [ $? -eq 0 ]; then
            echo "✓ 数据导入成功"
        else
            echo "✗ 数据导入失败"
            exit 1
        fi
    fi
fi

echo ""

# 步骤 3: 配置环境变量
echo "步骤 3: 配置环境变量..."
echo ""

if [ ! -f "api/.env" ]; then
    echo "创建 api/.env 文件..."
    cp api/.env.example api/.env
    
    read -p "请输入数据库主机 (默认: 127.0.0.1): " DB_HOST
    DB_HOST=${DB_HOST:-127.0.0.1}
    
    read -p "请输入数据库端口 (默认: 3306): " DB_PORT
    DB_PORT=${DB_PORT:-3306}
    
    read -p "请输入数据库用户名 (默认: root): " DB_USER
    DB_USER=${DB_USER:-root}
    
    read -p "请输入数据库密码: " -s DB_PASSWORD
    echo ""
    
    read -p "请输入数据库名称 (默认: data_center): " DB_NAME
    DB_NAME=${DB_NAME:-data_center}
    
    # 写入配置文件
    cat > api/.env << EOF
# MySQL 数据库配置
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
EOF
    
    echo "✓ 配置文件已创建"
else
    echo "✓ 配置文件已存在"
fi

echo ""

# 步骤 4: 安装 Python 依赖
echo "步骤 4: 安装 Python 依赖..."
echo ""

if [ ! -d "api/venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv api/venv
    
    echo "安装依赖包..."
    source api/venv/bin/activate
    pip install -r api/requirements.txt
    deactivate
    
    echo "✓ Python 依赖安装完成"
else
    echo "✓ 虚拟环境已存在"
fi

echo ""

# 步骤 5: 设置脚本权限
echo "步骤 5: 设置脚本权限..."
echo ""

chmod +x start-backend.sh
chmod +x start-frontend.sh
chmod +x start-all.sh
chmod +x stop-all.sh

echo "✓ 脚本权限已设置"
echo ""

# 步骤 6: 测试服务
echo "步骤 6: 测试服务..."
echo ""

read -p "是否立即启动服务进行测试? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "启动服务..."
    ./start-all.sh
else
    echo ""
    echo "========================================"
    echo "部署完成！"
    echo "========================================"
    echo ""
    echo "启动服务:"
    echo "  ./start-all.sh"
    echo ""
    echo "停止服务:"
    echo "  ./stop-all.sh"
    echo ""
    echo "访问地址:"
    echo "  http://localhost:8000"
    echo "========================================"
fi
