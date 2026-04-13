#!/bin/bash

# ========================================
# 一键启动所有服务 (Linux)
# ========================================

echo "========================================"
echo "大数据中心数据汇聚情况周报系统"
echo "========================================"
echo ""
echo "正在启动后端和前端服务..."
echo ""

# 检查是否已安装 Python3
if ! which python3 > /dev/null 2>&1; then
    echo "错误: 未找到 Python3，请先安装 Python3"
    exit 1
fi

# 给脚本添加执行权限
chmod +x start-backend.sh
chmod +x start-frontend.sh

# 在后台启动后端服务
echo "启动后端服务..."
./start-backend.sh > backend.log 2>&1 &
BACKEND_PID=$!
echo "后端服务 PID: $BACKEND_PID"

# 等待 3 秒让后端启动
sleep 3

# 在后台启动前端服务
echo "启动前端服务..."
./start-frontend.sh > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "前端服务 PID: $FRONTEND_PID"

echo ""
echo "========================================"
echo "服务已启动！"
echo "========================================"
echo ""
echo "后端 API: http://localhost:5000"
echo "前端页面: http://localhost:8000"
echo ""
echo "请在浏览器中访问: http://localhost:8000"
echo ""
echo "日志文件:"
echo "  后端日志: backend.log"
echo "  前端日志: frontend.log"
echo ""
echo "停止服务:"
echo "  kill $BACKEND_PID  # 停止后端"
echo "  kill $FRONTEND_PID  # 停止前端"
echo "  或运行: ./stop-all.sh"
echo "========================================"

# 保存 PID 到文件
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

# 等待用户按键
read -p "按 Enter 键查看后端日志 (Ctrl+C 退出)..."
tail -f backend.log
