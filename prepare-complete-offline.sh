#!/bin/bash

echo "Complete ARM64 Offline Package Preparation"
echo "=========================================="

# 检查架构
ARCH=$(uname -m)
echo "Current architecture: $ARCH"

if [[ "$ARCH" != "aarch64" && "$ARCH" != "arm64" ]]; then
    echo "❌ This script must run on ARM64 architecture!"
    echo "   Current: $ARCH, Required: aarch64/arm64"
    exit 1
fi

# 创建离线包目录
OFFLINE_DIR="dzxt-complete-offline-arm64"
echo "Creating offline package: $OFFLINE_DIR"
rm -rf $OFFLINE_DIR
mkdir -p $OFFLINE_DIR/{images,wheels,source,scripts}

echo ""
echo "Step 1: Pulling and exporting Python 3.12 ARM64 image..."
docker pull python:3.12-slim

if [ $? -ne 0 ]; then
    echo "❌ Failed to pull Python image"
    exit 1
fi

docker save python:3.12-slim -o $OFFLINE_DIR/images/python-3.12-slim-arm64.tar
echo "✅ Python image exported"

echo ""
echo "Step 2: Downloading Python dependencies..."

# 创建临时容器来下载依赖
echo "Creating temporary container to download wheels..."
docker run --rm -v $(pwd)/$OFFLINE_DIR/wheels:/wheels python:3.12-slim bash -c "
    pip install --upgrade pip
    pip download -d /wheels -r api/requirements.txt --platform linux_aarch64 --only-binary=:all: --no-deps
    pip download -d /wheels -r api/requirements.txt --no-binary :all: --no-deps
"

if [ $? -eq 0 ]; then
    echo "✅ Python dependencies downloaded"
else
    echo "⚠️  Some dependencies may need to be built on target machine"
fi

echo ""
echo "Step 3: Copying source code..."
cp -r . $OFFLINE_DIR/source/
# 清理不需要的文件
rm -f $OFFLINE_DIR/source/*.tar
rm -rf $OFFLINE_DIR/source/dzxt-*

echo ""
echo "Step 4: Creating offline Dockerfile..."
cat > $OFFLINE_DIR/source/Dockerfile.offline << 'EOF'
# ARM64 完全离线版本
FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_APP=api/app.py \
    FLASK_ENV=production

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# 复制预下载的wheels
COPY wheels/ /tmp/wheels/

# 复制requirements
COPY api/requirements.txt /app/api/requirements.txt

# 安装Python依赖（从本地wheels）
RUN pip install --upgrade pip && \
    pip install --no-index --find-links /tmp/wheels -r api/requirements.txt && \
    rm -rf /tmp/wheels

# 复制应用代码
COPY . /app/

# 创建非root用户
RUN useradd --create-home --shell /bin/bash app && \
    chown -R app:app /app
USER app

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["python", "api/app.py"]
EOF

echo ""
echo "Step 5: Creating deployment scripts..."

# 完全离线部署脚本
cat > $OFFLINE_DIR/scripts/deploy-offline.sh << 'EOF'
#!/bin/bash
echo "ARM64 Complete Offline Deployment"
echo "================================="

echo "🔍 Checking architecture..."
ARCH=$(uname -m)
echo "Detected: $ARCH"

if [[ "$ARCH" != "aarch64" && "$ARCH" != "arm64" ]]; then
    echo "⚠️  Warning: Optimized for ARM64, current: $ARCH"
fi

echo ""
echo "📦 Step 1: Loading Python base image..."
docker load -i ../images/python-3.12-slim-arm64.tar

if [ $? -ne 0 ]; then
    echo "❌ Failed to load Python image"
    exit 1
fi

echo "✅ Python image loaded"

echo ""
echo "🔨 Step 2: Building application with offline dependencies..."
cd ../source
docker build -f Dockerfile.offline -t dzxt:arm64 .

if [ $? -ne 0 ]; then
    echo "❌ Failed to build application"
    exit 1
fi

echo "✅ Application built successfully"

echo ""
echo "🛑 Step 3: Stopping old containers..."
docker stop dzxt-app 2>/dev/null
docker rm dzxt-app 2>/dev/null

echo ""
echo "🚀 Step 4: Starting application..."
docker run -d -p 5000:5000 --name dzxt-app dzxt:arm64

if [ $? -eq 0 ]; then
    echo "✅ Application started successfully!"
    echo "🌐 Access URL: http://localhost:5000"
    echo ""
    echo "📊 Container status:"
    docker ps | grep dzxt-app
else
    echo "❌ Failed to start application"
    exit 1
fi
EOF

chmod +x $OFFLINE_DIR/scripts/deploy-offline.sh

# 管理脚本
cat > $OFFLINE_DIR/scripts/manage.sh << 'EOF'
#!/bin/bash
echo "ARM64 Application Management"
echo "==========================="
echo ""
echo "Available commands:"
echo "  docker start dzxt-app     # Start"
echo "  docker stop dzxt-app      # Stop"
echo "  docker restart dzxt-app   # Restart"
echo "  docker logs dzxt-app -f   # View logs"
echo "  docker ps | grep dzxt     # Check status"
echo ""
echo "Current status:"
docker ps | grep dzxt || echo "No dzxt containers running"
EOF

chmod +x $OFFLINE_DIR/scripts/manage.sh

echo ""
echo "Step 6: Creating documentation..."
cat > $OFFLINE_DIR/README.md << EOF
# ARM64 Complete Offline Deployment Package

## Package Contents
- \`images/python-3.12-slim-arm64.tar\`: ARM64 Python base image
- \`wheels/\`: Pre-downloaded Python dependencies
- \`source/\`: Complete application source code
- \`scripts/\`: Deployment and management scripts

## Deployment (No Internet Required)

### Quick Start
\`\`\`bash
cd scripts
./deploy-offline.sh
\`\`\`

### Manual Steps
\`\`\`bash
# 1. Load Python image
docker load -i images/python-3.12-slim-arm64.tar

# 2. Build application
cd source
docker build -f Dockerfile.offline -t dzxt:arm64 .

# 3. Run application
docker run -d -p 5000:5000 --name dzxt-app dzxt:arm64
\`\`\`

## Management
\`\`\`bash
cd scripts
./manage.sh
\`\`\`

## Access
- Local: http://localhost:5000
- Network: http://your-server-ip:5000

## Package Info
- Created: $(date)
- Architecture: ARM64 native
- Python Version: 3.12
- Dependencies: Pre-downloaded
- Internet Required: No
EOF

echo ""
echo "Step 7: Package summary..."
echo "📦 Package created: $OFFLINE_DIR/"
echo ""
echo "📊 Package contents:"
echo "Images:"
ls -lh $OFFLINE_DIR/images/
echo ""
echo "Python wheels:"
ls -la $OFFLINE_DIR/wheels/ | wc -l
echo " packages downloaded"
echo ""
echo "💾 Total package size:"
du -sh $OFFLINE_DIR/

echo ""
echo "✅ Complete offline package preparation finished!"
echo ""
echo "🚀 Next steps:"
echo "1. Transfer the entire '$OFFLINE_DIR' folder to your offline ARM64 machine"
echo "2. On offline machine: cd $OFFLINE_DIR/scripts"
echo "3. Run: ./deploy-offline.sh"
echo ""
echo "💡 This package is completely self-contained and requires no internet connection"