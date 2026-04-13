#!/bin/bash

# ========================================
# 下载 Python 依赖包（离线部署用）
# ========================================

echo "========================================"
echo "下载 Python 依赖包"
echo "========================================"
echo ""

# 创建依赖包目录
mkdir -p offline-packages

# 下载依赖包到 offline-packages 目录
echo "正在下载依赖包..."
pip download -r api/requirements.txt -d offline-packages/

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ 依赖包下载完成！"
    echo ""
    echo "下载的包列表:"
    ls -lh offline-packages/
    echo ""
    echo "总大小:"
    du -sh offline-packages/
    echo ""
    echo "========================================"
    echo "打包文件"
    echo "========================================"
    
    # 创建离线部署包
    tar -czf offline-deployment.tar.gz \
        offline-packages/ \
        api/ \
        data/ \
        js/ \
        css/ \
        lib/ \
        d3-sankey-master/ \
        index.html \
        d3.v7.min.js \
        setup-database.sql \
        update-table-structure.sql \
        import-csv-to-mysql.py \
        start-backend.sh \
        start-frontend.sh \
        start-all.sh \
        stop-all.sh \
        wsl-start.sh \
        deploy-linux.sh \
        install-offline.sh \
        字段映射说明.md \
        README-MySQL.md \
        Linux部署指南.md \
        WSL快速部署指南.md \
        启动指南-MySQL版本.md
    
    echo ""
    echo "✓ 离线部署包创建完成: offline-deployment.tar.gz"
    echo ""
    ls -lh offline-deployment.tar.gz
    echo ""
    echo "========================================"
    echo "下一步："
    echo "1. 将 offline-deployment.tar.gz 传输到目标服务器"
    echo "2. 在目标服务器上解压: tar -xzf offline-deployment.tar.gz"
    echo "3. 运行安装脚本: ./install-offline.sh"
    echo "========================================"
else
    echo "✗ 依赖包下载失败"
    exit 1
fi
