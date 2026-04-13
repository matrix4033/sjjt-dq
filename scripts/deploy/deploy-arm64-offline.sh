#!/bin/bash

echo "ARM64离线部署脚本"
echo "=================="

# 检查镜像文件是否存在
if [ ! -f "dzxt-complete-offline.tar" ]; then
    echo "❌ 错误: 找不到 dzxt-complete-offline.tar 文件"
    echo "请确保已将镜像文件传输到当前目录"
    exit 1
fi

echo "1. 加载Docker镜像..."
docker load -i dzxt-complete-offline.tar

if [ $? -eq 0 ]; then
    echo "✅ 镜像加载成功"
else
    echo "❌ 镜像加载失败"
    exit 1
fi

echo ""
echo "2. 显示已加载的镜像:"
docker images

echo ""
echo "3. 构建ARM64版本..."
docker build -f Dockerfile.universal -t dzxt:arm64 .

if [ $? -eq 0 ]; then
    echo "✅ ARM64镜像构建成功"
else
    echo "❌ ARM64镜像构建失败"
    exit 1
fi

echo ""
echo "4. 停止并删除旧容器（如果存在）..."
docker stop dzxt-app 2>/dev/null
docker rm dzxt-app 2>/dev/null

echo ""
echo "5. 启动新容器..."
docker run -d -p 5000:5000 --name dzxt-app dzxt:arm64

if [ $? -eq 0 ]; then
    echo "✅ 应用启动成功！"
    echo ""
    echo "🌐 访问地址: http://localhost:5000"
    echo "📋 容器状态: docker ps"
    echo "📋 查看日志: docker logs dzxt-app"
else
    echo "❌ 应用启动失败"
    exit 1
fi