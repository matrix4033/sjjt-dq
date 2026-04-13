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
