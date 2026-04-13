# Linux 部署指南

## 目录
1. [快速部署](#快速部署)
2. [手动部署](#手动部署)
3. [生产环境部署](#生产环境部署)
4. [常见问题](#常见问题)

---

## 快速部署

### 一键部署脚本

```bash
# 1. 给脚本添加执行权限
chmod +x deploy-linux.sh

# 2. 运行部署脚本
./deploy-linux.sh
```

脚本会自动完成：
- ✓ 检查系统依赖（Python3、MySQL）
- ✓ 初始化数据库
- ✓ 导入 CSV 数据
- ✓ 配置环境变量
- ✓ 安装 Python 依赖
- ✓ 启动服务

---

## 手动部署

### 1. 系统要求

- **操作系统**: Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- **Python**: 3.7+
- **MySQL**: 8.0+
- **内存**: 至少 1GB
- **磁盘**: 至少 500MB

### 2. 安装系统依赖

#### Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install -y python3 python3-pip python3-venv mysql-server
```

#### CentOS/RHEL:
```bash
sudo yum install -y python3 python3-pip mysql-server
sudo systemctl start mysqld
sudo systemctl enable mysqld
```

### 3. 配置 MySQL

```bash
# 登录 MySQL
sudo mysql -u root -p

# 或者首次安装后
sudo mysql_secure_installation
```

### 4. 初始化数据库

```bash
# 创建数据库和表
mysql -u root -p < setup-database.sql

# 导入数据
python3 import-csv-to-mysql.py
```

### 5. 配置环境变量

```bash
# 复制配置文件
cp api/.env.example api/.env

# 编辑配置
nano api/.env
```

修改以下内容：
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的MySQL密码
DB_NAME=data_center
```

### 6. 安装 Python 依赖

```bash
# 创建虚拟环境
python3 -m venv api/venv

# 激活虚拟环境
source api/venv/bin/activate

# 安装依赖
pip install -r api/requirements.txt

# 退出虚拟环境
deactivate
```

### 7. 启动服务

#### 方式 1: 使用启动脚本（推荐）

```bash
# 给脚本添加执行权限
chmod +x start-all.sh start-backend.sh start-frontend.sh stop-all.sh

# 启动所有服务
./start-all.sh

# 停止所有服务
./stop-all.sh
```

#### 方式 2: 手动启动

```bash
# 终端 1: 启动后端
./start-backend.sh

# 终端 2: 启动前端
./start-frontend.sh
```

### 8. 访问系统

打开浏览器访问：
```
http://localhost:8000
```

或使用服务器 IP：
```
http://your-server-ip:8000
```

---

## 生产环境部署

### 使用 systemd + Nginx

#### 1. 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt-get install -y nginx

# CentOS/RHEL
sudo yum install -y nginx
```

#### 2. 安装 systemd 服务

```bash
# 给脚本添加执行权限
chmod +x install-systemd-service.sh

# 运行安装脚本（需要 root 权限）
sudo ./install-systemd-service.sh
```

#### 3. 配置 Nginx

```bash
# 复制 Nginx 配置
sudo cp nginx/data-center.conf /etc/nginx/sites-available/data-center

# 创建软链接
sudo ln -s /etc/nginx/sites-available/data-center /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

#### 4. 修改 Nginx 配置

编辑 `/etc/nginx/sites-available/data-center`：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 修改为你的域名或IP
    
    # ... 其他配置
}
```

#### 5. 配置防火墙

```bash
# Ubuntu/Debian (ufw)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

#### 6. 管理服务

```bash
# 启动服务
sudo systemctl start data-center-api

# 停止服务
sudo systemctl stop data-center-api

# 重启服务
sudo systemctl restart data-center-api

# 查看状态
sudo systemctl status data-center-api

# 查看日志
sudo journalctl -u data-center-api -f

# 开机自启
sudo systemctl enable data-center-api
```

---

## 使用 Gunicorn（生产环境推荐）

### 1. 安装 Gunicorn

```bash
source api/venv/bin/activate
pip install gunicorn
```

### 2. 修改 `api/app.py`

在文件末尾添加：

```python
if __name__ == '__main__':
    # 开发环境
    app.run(host='0.0.0.0', port=5000, debug=True)
```

### 3. 使用 Gunicorn 启动

```bash
# 在 api 目录下
cd api
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

参数说明：
- `-w 4`: 4 个工作进程
- `-b 0.0.0.0:5000`: 绑定到所有网络接口的 5000 端口
- `app:app`: 模块名:应用名

### 4. 修改 systemd 服务

编辑 `/etc/systemd/system/data-center-api.service`：

```ini
[Service]
ExecStart=/var/www/data-center/api/venv/bin/gunicorn -w 4 -b 127.0.0.1:5000 app:app
WorkingDirectory=/var/www/data-center/api
```

---

## 常见问题

### 1. 端口被占用

**错误**: `Address already in use`

**解决方法**:
```bash
# 查找占用端口的进程
sudo lsof -i :5000
sudo lsof -i :8000

# 杀死进程
sudo kill -9 <PID>
```

### 2. 权限问题

**错误**: `Permission denied`

**解决方法**:
```bash
# 给脚本添加执行权限
chmod +x *.sh

# 修改文件所有者
sudo chown -R $USER:$USER .
```

### 3. MySQL 连接失败

**错误**: `Access denied for user 'root'@'localhost'`

**解决方法**:
```bash
# 重置 MySQL 密码
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'new_password';
FLUSH PRIVILEGES;
EXIT;

# 更新 api/.env 文件中的密码
```

### 4. Python 虚拟环境问题

**错误**: `No module named 'flask'`

**解决方法**:
```bash
# 确保激活虚拟环境
source api/venv/bin/activate

# 重新安装依赖
pip install -r api/requirements.txt
```

### 5. 防火墙阻止访问

**解决方法**:
```bash
# Ubuntu/Debian
sudo ufw allow 8000/tcp
sudo ufw allow 5000/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --reload
```

### 6. 查看日志

```bash
# 后端日志
tail -f backend.log

# 前端日志
tail -f frontend.log

# systemd 服务日志
sudo journalctl -u data-center-api -f

# Nginx 日志
sudo tail -f /var/log/nginx/data-center-access.log
sudo tail -f /var/log/nginx/data-center-error.log
```

---

## 性能优化

### 1. 数据库优化

```sql
-- 添加索引
USE data_center;
CREATE INDEX idx_dept ON 明细(部门);
CREATE INDEX idx_status ON 明细(部门到前置机状态, 前置机到前置仓状态, 前置仓到贴源层状态);
```

### 2. Nginx 缓存

在 Nginx 配置中添加：

```nginx
# 缓存配置
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m;

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    # ... 其他配置
}
```

### 3. Gunicorn 工作进程

根据 CPU 核心数调整：

```bash
# 推荐: (2 x CPU核心数) + 1
gunicorn -w 9 -b 0.0.0.0:5000 app:app  # 4核CPU
```

---

## 安全建议

1. **修改默认端口**: 不要使用默认的 5000 和 8000 端口
2. **配置 HTTPS**: 使用 Let's Encrypt 免费证书
3. **限制数据库访问**: 只允许本地连接
4. **定期备份**: 定期备份数据库和配置文件
5. **更新系统**: 定期更新系统和依赖包

```bash
# 数据库备份
mysqldump -u root -p data_center > backup_$(date +%Y%m%d).sql

# 恢复数据库
mysql -u root -p data_center < backup_20231201.sql
```

---

## 监控和维护

### 1. 设置日志轮转

创建 `/etc/logrotate.d/data-center`：

```
/var/log/data-center/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload data-center-api > /dev/null 2>&1 || true
    endscript
}
```

### 2. 监控服务状态

```bash
# 创建监控脚本
cat > /usr/local/bin/check-data-center.sh << 'EOF'
#!/bin/bash
if ! systemctl is-active --quiet data-center-api; then
    echo "Service is down, restarting..."
    systemctl restart data-center-api
    echo "Service restarted at $(date)" >> /var/log/data-center/restart.log
fi
EOF

chmod +x /usr/local/bin/check-data-center.sh

# 添加到 crontab（每5分钟检查一次）
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/check-data-center.sh") | crontab -
```

---

**部署完成！** 🎉

如有问题，请查看日志文件或联系技术支持。
