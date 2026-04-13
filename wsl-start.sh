#!/bin/bash

# ========================================
# WSL 环境一键启动脚本
# ========================================

echo "========================================"
echo "大数据中心数据汇聚情况周报系统"
echo "WSL 环境启动"
echo "========================================"
echo ""

# 步骤 1: 启动 MySQL 服务
echo "步骤 1: 启动 MySQL 服务..."
sudo service mysql start

# 等待 MySQL 启动
sleep 2

# 检查 MySQL 状态
if sudo service mysql status | grep -q "running"; then
    echo "✓ MySQL 服务已启动"
else
    echo "✗ MySQL 启动失败，请检查 MySQL 安装"
    echo ""
    echo "安装 MySQL:"
    echo "  sudo apt-get update"
    echo "  sudo apt-get install mysql-server"
    exit 1
fi

echo ""

# 步骤 2: 检查数据库配置
echo "步骤 2: 检查配置文件..."
if [ ! -f "api/.env" ]; then
    echo "✗ 未找到 api/.env 文件"
    echo ""
    echo "请先配置数据库连接:"
    echo "  cp api/.env.example api/.env"
    echo "  nano api/.env"
    exit 1
else
    echo "✓ 配置文件存在"
fi

echo ""

# 步骤 3: 检查数据库是否已初始化
echo "步骤 3: 检查数据库..."
DB_EXISTS=$(mysql -u root -p$(grep DB_PASSWORD api/.env | cut -d '=' -f2) -e "SHOW DATABASES LIKE 'data_center';" 2>/dev/null | grep data_center)

if [ -z "$DB_EXISTS" ]; then
    echo "⚠ 数据库未初始化"
    read -p "是否立即初始化数据库? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "初始化数据库..."
        mysql -u root -p < setup-database.sql
        
        if [ $? -eq 0 ]; then
            echo "✓ 数据库初始化成功"
            
            read -p "是否导入 CSV 数据? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                python3 import-csv-to-mysql.py
            fi
        else
            echo "✗ 数据库初始化失败"
            exit 1
        fi
    else
        echo "跳过数据库初始化"
    fi
else
    echo "✓ 数据库已存在"
fi

echo ""

# 步骤 4: 给脚本添加执行权限
echo "步骤 4: 设置脚本权限..."
chmod +x start-all.sh start-backend.sh start-frontend.sh stop-all.sh
echo "✓ 权限设置完成"

echo ""

# 步骤 5: 启动应用服务
echo "步骤 5: 启动应用服务..."
echo ""
./start-all.sh
