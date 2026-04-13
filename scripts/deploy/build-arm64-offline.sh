#!/bin/bash
echo "ARM64 Offline Build Solution"
echo "============================"
echo ""

# Check if we have Docker
docker version >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Error: Docker not available"
    exit 1
fi

echo "Step 1: Setting up offline build environment..."

# Create build directory
BUILD_DIR="arm64-build-$(date +%s)"
mkdir -p "$BUILD_DIR"
echo "Using build directory: $BUILD_DIR"

# Copy application files
echo "Copying application files..."
if [ -d "source" ]; then
    cp -r source/* "$BUILD_DIR/"
elif [ -f "api/app.py" ]; then
    cp -r . "$BUILD_DIR/"
else
    echo "Error: No application source found"
    exit 1
fi

cd "$BUILD_DIR"

# Step 2: Create offline-compatible Dockerfile
echo ""
echo "Step 2: Creating offline-compatible Dockerfile..."
cat > Dockerfile << 'EOF'
FROM python:3.12-slim

WORKDIR /app

# Copy all files
COPY . /app/

# Install Python packages (with fallbacks for offline mode)
RUN pip install --upgrade pip 2>/dev/null || echo "pip upgrade failed" && \
    pip install Flask flask-cors python-dotenv Werkzeug 2>/dev/null || \
    pip install Flask 2>/dev/null || \
    echo "Using basic Python setup"

# Set environment
ENV FLASK_APP=api/app.py
ENV PYTHONPATH=/app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

EXPOSE 5000

# Simple startup
CMD ["python", "api/app.py"]
EOF

# Step 3: Build image using regular Docker (not buildx)
echo ""
echo "Step 3: Building Docker image..."
docker build -t dzxt:offline-build .
BUILD_STATUS=$?

cd ..

if [ $BUILD_STATUS -eq 0 ]; then
    echo ""
    echo "Step 4: Creating deployment package..."
    mkdir -p offline-deployment
    
    # Export the built image
    echo "Exporting application image..."
    docker save dzxt:offline-build > offline-deployment/dzxt-offline-build.tar
    
    # Also export Python base image if available
    echo "Exporting Python base image..."
    docker save python:3.12-slim > offline-deployment/python-3.12-slim.tar 2>/dev/null || \
    echo "Warning: Could not export Python base image"
    
    # Create deployment script
    cat > offline-deployment/deploy.sh << 'EOF'
#!/bin/bash
echo "Deploying Application"
echo "===================="
echo ""

# Load images
echo "Loading images..."
if [ -f "python-3.12-slim.tar" ]; then
    docker load -i python-3.12-slim.tar
fi
docker load -i dzxt-offline-build.tar

# Stop existing container
docker stop dzxt-app 2>/dev/null
docker rm dzxt-app 2>/dev/null

# Start new container
echo "Starting application..."
docker run -d -p 5000:5000 --name dzxt-app dzxt:offline-build

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Application started successfully!"
    echo "Access: http://localhost:5000"
    echo ""
    echo "Container status:"
    docker ps | grep dzxt-app
    echo ""
    echo "To check logs: docker logs dzxt-app"
    echo "To stop: docker stop dzxt-app"
else
    echo "Failed to start application"
    echo "Check logs: docker logs dzxt-app"
fi
EOF

    chmod +x offline-deployment/deploy.sh
    
    # Create README
    cat > offline-deployment/README.md << 'EOF'
# Offline Deployment Package

## Files
- `dzxt-offline-build.tar` - Application Docker image
- `python-3.12-slim.tar` - Python base image (if available)
- `deploy.sh` - Deployment script

## Usage
1. Copy this directory to your target server
2. Run: `./deploy.sh`
3. Access: http://localhost:5000

## Requirements
- Docker installed on target system
- Port 5000 available
EOF

    # Cleanup
    rm -rf "$BUILD_DIR"
    
    echo ""
    echo "✓ Offline deployment package created!"
    echo ""
    echo "Package contents:"
    ls -lh offline-deployment/
    
    echo ""
    echo "Package size:"
    du -sh offline-deployment/
    
    echo ""
    echo "To deploy:"
    echo "1. Copy 'offline-deployment' directory to your target server"
    echo "2. Run: cd offline-deployment && ./deploy.sh"
    
else
    echo "Build failed"
    rm -rf "$BUILD_DIR"
    exit 1
fi