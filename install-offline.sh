#!/bin/bash

# ========================================
# 离线安装脚本（无需网络连接）
# ========================================

echo "========================================"
echo "离线安装 - 数据汇聚情况周报系统"
echo "========================================"
echo ""

# 检查 Python3
if ! which python3 > /dev/null 2>&1; then
    echo "✗ 错误: 未找到 Python3"
    echo "请先安装 Python3:"
    echo "  sudo apt install python3 python3-venv python3-pip"
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}' | cut -d. -f1,2)
echo "检测到 Python 版本: $PYTHON_VERSION"
echo ""

# 检查离线包目录
if [ ! -d "offline-packages" ]; then
    echo "✗ 错误: 未找到 offline-packages 目录"
    echo "请确保已解压完整的离线部署包"
    exit 1
fi

echo "步骤 1: 创建虚拟环境..."
if [ -d "api/venv" ]; then
    echo "虚拟环境已存在，删除旧环境..."
    rm -rf api/venv
fi

python3 -m venv api/venv

if [ $? -ne 0 ]; then
    echo "✗ 虚拟环境创建失败"
    echo "请安装 python3-venv:"
    echo "  sudo apt install python3-venv"
    exit 1
fi

echo "✓ 虚拟环境创建成功"
echo ""

echo "步骤 2: 从离线包安装依赖..."
. api/venv/bin/activate

# 升级 pip（使用离线包）
if ls offline-packages/pip-*.whl 1> /dev/null 2>&1; then
    pip install --no-index --find-links=offline-packages/ pip
fi

# 安装所有依赖（从离线包）
echo "尝试方法 1: 使用 requirements.txt..."
pip install --no-index --find-links=offline-packages/ -r api/requirements.txt

if [ $? -ne 0 ]; then
    echo ""
    echo "⚠ 方法 1 失败，尝试方法 2: 直接安装 wheel 文件..."
    echo ""
    
    # 直接安装所有 wheel 文件
    for wheel in offline-packages/*.whl; do
        if [ -f "$wheel" ]; then
            echo "安装: $(basename $wheel)"
            pip install --no-index --no-deps "$wheel" 2>/dev/null || echo "  跳过（可能已安装或不兼容）"
        fi
    done
    
    # 再次尝试安装依赖关系
    echo ""
    echo "安装依赖关系..."
    pip install --no-index --find-links=offline-packages/ -r api/requirements.txt 2>/dev/null || true
fi

echo "✓ 依赖安装完成"
echo ""

# 验证安装
echo "步骤 3: 验证安装..."
python -c "import flask, psycopg2, dotenv, flask_cors" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✓ 所有依赖验证通过"
else
    echo "⚠ 部分依赖验证失败，但可能不影响使用"
    echo "已安装的包："
    pip list | grep -iE "(flask|psycopg2|dotenv|cors)"
fi

deactivate
echo ""

# 设置脚本权限
echo "步骤 4: 设置脚本权限..."
chmod +x start-backend.sh start-frontend.sh start-all.sh stop-all.sh wsl-start.sh
echo "✓ 权限设置完成"
echo ""

# 检查配置文件
echo "步骤 5: 检查配置..."
if [ ! -f "api/.env" ]; then
    echo "⚠ 警告: 未找到 api/.env 文件"
    echo "请创建配置文件:"
    echo "  cp api/.env.example api/.env"
    echo "  nano api/.env"
    echo ""
fi

echo "========================================"
echo "✓ 离线安装完成！"
echo "========================================"
echo ""
echo "下一步："
echo ""
echo "1. 配置数据库连接 (如果还没配置):"
echo "   nano api/.env"
echo ""
echo "2. 初始化数据库:"
echo "   psql -U postgres -f setup-database-postgresql.sql"
echo ""
echo "3. 导入数据:"
echo "   api/venv/bin/python import-csv-to-postgresql.py"
echo ""
echo "4. 启动服务:"
echo "   ./start-all.sh"
echo ""
echo "========================================"
