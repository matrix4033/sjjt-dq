#!/bin/bash

# ========================================
# 启动 Python API 后端服务 (Linux)
# ========================================

echo "========================================"
echo "启动 Python API 后端服务"
echo "========================================"
echo ""

# 检查是否已安装 Python3
if ! which python3 > /dev/null 2>&1; then
    echo "✗ 错误: 未找到 Python3，请先安装 Python3"
    exit 1
fi

# 获取 Python 版本
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}' | cut -d. -f1,2)
echo "检测到 Python 版本: $PYTHON_VERSION"

# 检查 .env 文件
if [ ! -f "api/.env" ]; then
    echo "✗ 警告: 未找到 api/.env 文件"
    echo "请复制 api/.env.example 为 api/.env 并配置数据库连接"
    echo ""
    read -p "按 Enter 键退出..."
    exit 1
fi

# 检查是否已创建虚拟环境
if [ ! -d "api/venv" ] || [ ! -f "api/venv/bin/python" ]; then
    echo ""
    echo "首次运行，正在创建虚拟环境..."
    
    # 尝试创建虚拟环境
    python3 -m venv api/venv 2>/dev/null
    
    if [ $? -ne 0 ]; then
        echo "✗ 虚拟环境创建失败"
        echo ""
        echo "需要安装 python3-venv 包"
        echo "请执行以下命令:"
        echo ""
        echo "  sudo apt install python3-venv"
        echo ""
        echo "或者针对你的 Python 版本:"
        echo "  sudo apt install python${PYTHON_VERSION}-venv"
        echo ""
        read -p "是否现在安装? (需要 sudo 权限) [y/N] " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "正在安装 python3-venv..."
            sudo apt update
            sudo apt install -y python3-venv python3-pip
            
            # 清理失败的虚拟环境
            rm -rf api/venv
            
            # 重新创建
            echo "重新创建虚拟环境..."
            python3 -m venv api/venv
            
            if [ $? -ne 0 ]; then
                echo "✗ 虚拟环境创建仍然失败"
                exit 1
            fi
        else
            echo "已取消，请手动安装后重试"
            exit 1
        fi
    fi
    
    echo "✓ 虚拟环境创建成功"
    echo ""
    echo "正在安装依赖包..."
    
    # 激活虚拟环境并安装依赖
    . api/venv/bin/activate
    pip install --upgrade pip > /dev/null 2>&1
    pip install -r api/requirements.txt
    
    if [ $? -ne 0 ]; then
        echo "✗ 依赖安装失败"
        deactivate
        exit 1
    fi
    
    echo "✓ 依赖安装完成"
    deactivate
    echo ""
fi

echo "启动 API 服务..."
echo "API 地址: http://localhost:5000"
echo "按 Ctrl+C 停止服务器"
echo ""

# 使用虚拟环境中的 Python 运行
if [ -f "api/venv/bin/python" ]; then
    api/venv/bin/python api/app.py
else
    echo "✗ 虚拟环境未正确安装"
    echo ""
    echo "请手动执行以下命令:"
    echo "  sudo apt install python3-venv"
    echo "  rm -rf api/venv"
    echo "  python3 -m venv api/venv"
    echo "  . api/venv/bin/activate"
    echo "  pip install -r api/requirements.txt"
    echo "  deactivate"
    exit 1
fi
