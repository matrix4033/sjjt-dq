#!/bin/bash

# ========================================
# 安装 systemd 服务 (生产环境)
# ========================================

echo "========================================"
echo "安装 systemd 服务"
echo "========================================"
echo ""

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo "错误: 此脚本需要 root 权限"
    echo "请使用: sudo ./install-systemd-service.sh"
    exit 1
fi

# 获取当前目录
CURRENT_DIR=$(pwd)
echo "当前目录: $CURRENT_DIR"
echo ""

# 步骤 1: 创建日志目录
echo "步骤 1: 创建日志目录..."
mkdir -p /var/log/data-center
chown www-data:www-data /var/log/data-center
echo "✓ 日志目录已创建"
echo ""

# 步骤 2: 复制项目到 /var/www
echo "步骤 2: 复制项目文件..."
read -p "是否将项目复制到 /var/www/data-center? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    mkdir -p /var/www/data-center
    cp -r * /var/www/data-center/
    chown -R www-data:www-data /var/www/data-center
    echo "✓ 项目文件已复制"
    PROJECT_DIR="/var/www/data-center"
else
    PROJECT_DIR="$CURRENT_DIR"
    echo "使用当前目录: $PROJECT_DIR"
fi
echo ""

# 步骤 3: 修改 service 文件中的路径
echo "步骤 3: 配置 systemd 服务..."
sed -i "s|/var/www/data-center|$PROJECT_DIR|g" systemd/data-center-api.service
echo "✓ 服务配置已更新"
echo ""

# 步骤 4: 复制 service 文件
echo "步骤 4: 安装 systemd 服务..."
cp systemd/data-center-api.service /etc/systemd/system/
systemctl daemon-reload
echo "✓ systemd 服务已安装"
echo ""

# 步骤 5: 启用并启动服务
echo "步骤 5: 启动服务..."
read -p "是否立即启动服务? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    systemctl enable data-center-api.service
    systemctl start data-center-api.service
    
    sleep 2
    
    # 检查服务状态
    if systemctl is-active --quiet data-center-api.service; then
        echo "✓ 服务启动成功"
        systemctl status data-center-api.service
    else
        echo "✗ 服务启动失败"
        echo "查看日志: journalctl -u data-center-api.service -n 50"
        exit 1
    fi
else
    echo "跳过启动服务"
    echo ""
    echo "手动启动服务:"
    echo "  sudo systemctl enable data-center-api.service"
    echo "  sudo systemctl start data-center-api.service"
fi

echo ""
echo "========================================"
echo "systemd 服务安装完成！"
echo "========================================"
echo ""
echo "常用命令:"
echo "  启动服务: sudo systemctl start data-center-api"
echo "  停止服务: sudo systemctl stop data-center-api"
echo "  重启服务: sudo systemctl restart data-center-api"
echo "  查看状态: sudo systemctl status data-center-api"
echo "  查看日志: sudo journalctl -u data-center-api -f"
echo "========================================"
