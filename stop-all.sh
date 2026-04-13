#!/bin/bash

# ========================================
# 停止所有服务 (Linux)
# ========================================

echo "========================================"
echo "停止所有服务"
echo "========================================"
echo ""

# 读取 PID 文件
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "停止后端服务 (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        echo "✓ 后端服务已停止"
    else
        echo "后端服务未运行"
    fi
    rm .backend.pid
else
    echo "未找到后端服务 PID 文件"
fi

if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "停止前端服务 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        echo "✓ 前端服务已停止"
    else
        echo "前端服务未运行"
    fi
    rm .frontend.pid
else
    echo "未找到前端服务 PID 文件"
fi

echo ""
echo "========================================"
echo "所有服务已停止"
echo "========================================"
