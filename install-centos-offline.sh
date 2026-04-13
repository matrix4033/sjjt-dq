#!/bin/bash

# ========================================
# CentOS 离线安装脚本
# ========================================

echo "========================================"
echo "CentOS 离线安装 - 数据汇聚情况周报系统"
echo "========================================"
echo ""

# 检查是否为 CentOS
if [ -f /etc/redhat-release ]; then
    OS_VERSION=$(cat /etc/redhat-release)
    echo "操作系统: $OS_VERSION"
else
    echo "⚠ 警告: 未检测到 CentOS/RHEL 系统"
fi
echo ""

# 检查 Python3
if ! command -v python3 &> /dev/null; then
    echo "✗ 错误: 未找到 Python3"
    echo ""
    echo "请先安装 Python3:"
    echo "  CentOS 7: sudo yum install python3"
    echo "  CentOS 8: sudo dnf install python3"
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "Python 版本: $PYTHON_VERSION"
echo ""

# 检查离线包
if [ ! -d "offline-packages" ]; then
    echo "✗ 错误: 未找到 offline-packages 目录"
    echo ""
    echo "请先解压依赖包:"
    echo "  tar -xzf python-packages.tar.gz"
    exit 1
fi

PACKAGE_COUNT=$(ls offline-packages/*.whl 2>/dev/null | wc -l)
echo "找到 $PACKAGE_COUNT 个依赖包"
echo ""

# 步骤 1: 创建虚拟环境
echo "步骤 1: 创建虚拟环境..."
if [ -d "api/venv" ]; then
    echo "虚拟环境已存在，删除旧环境..."
    rm -rf api/venv
fi

python3 -m venv api/venv

if [ $? -ne 0 ]; then
    echo "✗ 虚拟环境创建失败"
    echo ""
    echo "可能的原因:"
    echo "1. 缺少 python3-venv 模块"
    echo "2. 缺少编译工具"
    echo ""
    echo "解决方法:"
    echo "  sudo yum install python3-devel gcc"
    exit 1
fi

echo "✓ 虚拟环境创建成功"
echo ""

# 步骤 2: 安装依赖
echo "步骤 2: 从离线包安装依赖..."
source api/venv/bin/activate

# 升级 pip（如果离线包中有）
if ls offline-packages/pip-*.whl 1> /dev/null 2>&1; then
    echo "升级 pip..."
    pip install --no-index --find-links=offline-packages/ --upgrade pip
fi

# 安装所有依赖
echo "安装依赖包..."
pip install --no-index --find-links=offline-packages/ -r api/requirements.txt

if [ $? -ne 0 ]; then
    echo "✗ 依赖安装失败"
    echo ""
    echo "可能的原因:"
    echo "1. 离线包不完整"
    echo "2. Python 版本不匹配"
    echo "3. 缺少系统依赖"
    echo ""
    deactivate
    exit 1
fi

echo "✓ 依赖安装完成"
echo ""

# 步骤 3: 验证安装
echo "步骤 3: 验证安装..."
python -c "import flask, pymysql, dotenv, flask_cors" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✓ 所有依赖验证通过"
    echo ""
    echo "已安装的包:"
    pip list | grep -E "Flask|pymysql|dotenv|Cors"
else
    echo "✗ 依赖验证失败"
    echo ""
    echo "请检查安装日志"
    deactivate
    exit 1
fi

deactivate
echo ""

# 步骤 4: 设置脚本权限
echo "步骤 4: 设置脚本权限..."
chmod +x start-backend.sh start-frontend.sh start-all.sh stop-all.sh 2>/dev/null
echo "✓ 权限设置完成"
echo ""

# 步骤 5: 检查配置
echo "步骤 5: 检查配置..."
if [ ! -f "api/.env" ]; then
    echo "⚠ 警告: 未找到 api/.env 文件"
    if [ -f "api/.env.example" ]; then
        echo "创建配置文件..."
        cp api/.env.example api/.env
        echo "✓ 已创建 api/.env，请编辑配置"
    fi
    echo ""
fi

# 步骤 6: 检查 MySQL
echo "步骤 6: 检查 MySQL/MariaDB..."
if command -v mysql &> /dev/null; then
    echo "✓ MySQL 客户端已安装"
    
    # 检查服务状态
    if systemctl is-active --quiet mysqld 2>/dev/null; then
        echo "✓ MySQL 服务正在运行"
    elif systemctl is-active --quiet mariadb 2>/dev/null; then
        echo "✓ MariaDB 服务正在运行"
    else
        echo "⚠ MySQL/MariaDB 服务未运行"
        echo "启动服务:"
        echo "  sudo systemctl start mysqld"
        echo "  或"
        echo "  sudo systemctl start mariadb"
    fi
else
    echo "⚠ 未检测到 MySQL/MariaDB"
    echo "安装方法:"
    echo "  CentOS 7: sudo yum install mariadb-server"
    echo "  CentOS 8: sudo dnf install mysql-server"
fi
echo ""

# 步骤 7: 检查防火墙
echo "步骤 7: 检查防火墙..."
if systemctl is-active --quiet firewalld; then
    echo "⚠ 防火墙正在运行"
    echo "需要开放端口:"
    echo "  sudo firewall-cmd --permanent --add-port=5000/tcp"
    echo "  sudo firewall-cmd --permanent --add-port=8000/tcp"
    echo "  sudo firewall-cmd --reload"
else
    echo "✓ 防火墙未运行"
fi
echo ""

echo "========================================"
echo "✓ 离线安装完成！"
echo "========================================"
echo ""
echo "下一步操作:"
echo ""
echo "1. 配置数据库连接:"
echo "   vi api/.env"
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
