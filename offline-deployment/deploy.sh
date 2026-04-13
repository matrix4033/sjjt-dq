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
