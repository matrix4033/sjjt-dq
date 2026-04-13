#!/bin/bash

# ========================================
# 启动前端服务器 (Linux)
# ========================================

echo "========================================"
echo "启动前端服务器"
echo "========================================"
echo ""

# 检查是否已安装 Python3
if ! which python3 > /dev/null 2>&1; then
    echo "错误: 未找到 Python3，请先安装 Python3"
    exit 1
fi

echo "启动前端服务器..."
echo "前端地址: http://localhost:8000"
echo "按 Ctrl+C 停止服务器"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 切换到项目根目录
cd "$SCRIPT_DIR"

# 确认 index.html 存在
if [ ! -f "index.html" ]; then
    echo "错误: 未找到 index.html 文件"
    echo "当前目录: $(pwd)"
    exit 1
fi

echo "项目目录: $(pwd)"
echo ""

python3 -m http.server 8000
