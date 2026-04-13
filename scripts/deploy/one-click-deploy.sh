#!/bin/bash

# ARM64 一键离线部署脚本
echo "🚀 ARM64 One-Click Offline Deployment"
echo "====================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 检查架构
ARCH=$(uname -m)
echo -e "${BLUE}🔍 System Architecture: $ARCH${NC}"

if [[ "$ARCH" != "aarch64" && "$ARCH" != "arm64" ]]; then
    echo -e "${YELLOW}⚠️  Warning: This deployment is optimized for ARM64${NC}"
    echo -e "${YELLOW}   Current architecture: $ARCH${NC}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 检查Docker
echo -e "${BLUE}🔍 Checking Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed!${NC}"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker daemon is not running!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is ready${NC}"

# 检查必需文件
echo -e "${BLUE}🔍 Checking required files...${NC}"

PYTHON_IMAGE=""
APP_IMAGE=""
SOURCE_DIR=""

# 查找Python镜像
if [ -f "images/python-3.12-slim-arm64.tar" ]; then
    PYTHON_IMAGE="images/python-3.12-slim-arm64.tar"
elif [ -f "python-3.12-slim-arm64.tar" ]; then
    PYTHON_IMAGE="python-3.12-slim-arm64.tar"
elif [ -f "python-3.12-slim.tar" ]; then
    PYTHON_IMAGE="python-3.12-slim.tar"
else
    echo -e "${RED}❌ Python base image not found!${NC}"
    echo "Expected files:"
    echo "  - images/python-3.12-slim-arm64.tar"
    echo "  - python-3.12-slim-arm64.tar"
    echo "  - python-3.12-slim.tar"
    exit 1
fi

# 查找应用镜像
if [ -f "images/dzxt-app-arm64.tar" ]; then
    APP_IMAGE="images/dzxt-app-arm64.tar"
elif [ -f "dzxt-app-arm64.tar" ]; then
    APP_IMAGE="dzxt-app-arm64.tar"
fi

# 查找源码目录
if [ -d "source" ]; then
    SOURCE_DIR="source"
elif [ -f "Dockerfile.arm64-native" ]; then
    SOURCE_DIR="."
fi

echo -e "${GREEN}✅ Found Python image: $PYTHON_IMAGE${NC}"
if [ -n "$APP_IMAGE" ]; then
    echo -e "${GREEN}✅ Found app image: $APP_IMAGE${NC}"
else
    echo -e "${YELLOW}⚠️  App image not found, will build from source${NC}"
fi

if [ -n "$SOURCE_DIR" ]; then
    echo -e "${GREEN}✅ Found source code: $SOURCE_DIR${NC}"
else
    echo -e "${YELLOW}⚠️  Source code not found${NC}"
fi

# 开始部署
echo ""
echo -e "${BLUE}🚀 Starting deployment...${NC}"

# 1. 加载Python基础镜像
echo -e "${BLUE}📦 Step 1: Loading Python base image...${NC}"
docker load -i "$PYTHON_IMAGE"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Python base image loaded${NC}"
else
    echo -e "${RED}❌ Failed to load Python base image${NC}"
    exit 1
fi

# 2. 加载或构建应用镜像
if [ -n "$APP_IMAGE" ]; then
    echo -e "${BLUE}📦 Step 2: Loading application image...${NC}"
    docker load -i "$APP_IMAGE"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Application image loaded${NC}"
    else
        echo -e "${RED}❌ Failed to load application image${NC}"
        exit 1
    fi
else
    echo -e "${BLUE}🔨 Step 2: Building application from source...${NC}"
    if [ -n "$SOURCE_DIR" ]; then
        cd "$SOURCE_DIR"
        docker build -f Dockerfile.arm64-native -t dzxt:arm64 .
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Application built successfully${NC}"
            cd - > /dev/null
        else
            echo -e "${RED}❌ Failed to build application${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ No source code available for building${NC}"
        exit 1
    fi
fi

# 3. 停止旧容器
echo -e "${BLUE}🛑 Step 3: Stopping old containers...${NC}"
docker stop dzxt-app 2>/dev/null
docker rm dzxt-app 2>/dev/null
echo -e "${GREEN}✅ Old containers cleaned${NC}"

# 4. 启动新容器
echo -e "${BLUE}🚀 Step 4: Starting application...${NC}"
docker run -d -p 5000:5000 --name dzxt-app dzxt:arm64

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Application started successfully!${NC}"
else
    echo -e "${RED}❌ Failed to start application${NC}"
    exit 1
fi

# 5. 验证部署
echo -e "${BLUE}📊 Step 5: Verifying deployment...${NC}"
sleep 3

# 检查容器状态
if docker ps | grep -q dzxt-app; then
    echo -e "${GREEN}✅ Container is running${NC}"
    docker ps | grep dzxt-app
else
    echo -e "${RED}❌ Container is not running${NC}"
    echo "Container logs:"
    docker logs dzxt-app
    exit 1
fi

# 检查应用响应
echo -e "${BLUE}🌐 Testing application response...${NC}"
sleep 2

if command -v curl &> /dev/null; then
    if curl -s http://localhost:5000 > /dev/null; then
        echo -e "${GREEN}✅ Application is responding${NC}"
    else
        echo -e "${YELLOW}⚠️  Application may still be starting...${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  curl not available, skipping response test${NC}"
fi

# 部署完成
echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Access Information:${NC}"
echo "  🌐 Local:   http://localhost:5000"
echo "  🌐 Network: http://$(hostname -I | awk '{print $1}'):5000"
echo ""
echo -e "${BLUE}📋 Management Commands:${NC}"
echo "  📊 Status:  docker ps | grep dzxt"
echo "  📋 Logs:    docker logs dzxt-app -f"
echo "  🔄 Restart: docker restart dzxt-app"
echo "  🛑 Stop:    docker stop dzxt-app"
echo "  🗑️  Remove:  docker stop dzxt-app && docker rm dzxt-app"
echo ""
echo -e "${GREEN}✨ Enjoy your application!${NC}"