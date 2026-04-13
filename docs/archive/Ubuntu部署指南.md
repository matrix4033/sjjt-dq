# Ubuntu 部署指南 - PostgreSQL 版本

## 系统要求

- Ubuntu 18.04 / 20.04 / 22.04 LTS
- Python 3.7+
- PostgreSQL 12+
- 2GB+ RAM
- 10GB+ 磁盘空间

---

## 快速部署（一键脚本）

```bash
# 下载并运行部署脚本
chmod +x deploy-ubuntu.sh
./deploy-ubuntu.sh
```

---

## 完整部署步骤

### 第一步：更新系统

```bash
# 更新软件包列表
sudo apt update

# 升级已安装的软件包（可选）
sudo apt upgrade -y
```

---

### 第二步：安装 PostgreSQL

#### 2.1 安装 PostgreSQL

```bash
# 安装 PostgreSQL 和相关工具
sudo apt install -y postgresql postgresql-contrib

# 启动 PostgreSQL 服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 检查服务状态
sudo systemctl status postgresql
```

#### 2.2 配置 PostgreSQL

```bash
# 切换到 postgres 用户
sudo -i -u postgres

# 进入 PostgreSQL 命令行
psql

# 创建数据库
CREATE DATABASE data_center;

# 创建用户（可选，如果不使用 postgres 用户）
CREATE USER datacenter_user WITH PASSWORD 'your_password';

# 授予权限
GRANT ALL PRIVILEGES ON DATABASE data_center TO datacenter_user;

# 退出
\q
exit
```

#### 2.3 配置远程访问（如果需要）

```bash
# 编辑 postgresql.conf
sudo nano /etc/postgresql/14/main/postgresql.conf

# 修改监听地址（找到这一行并取消注释）
listen_addresses = '*'

# 编辑 pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# 添加以下行（允许密码认证）
host    all             all             0.0.0.0/0               md5

# 重启 PostgreSQL
sudo systemctl restart postgresql
```

---

### 第三步：安装 Python 和依赖

#### 3.1 安装 Python

```bash
# Ubuntu 18.04/20.04 通常自带 Python 3
python3 --version

# 如果没有，安装 Python 3
sudo apt install -y python3 python3-pip python3-venv

# 安装开发工具（psycopg2 需要）
sudo apt install -y python3-dev libpq-dev build-essential
```

#### 3.2 创建项目目录

```bash
# 创建项目目录
sudo mkdir -p /opt/data-center
cd /opt/data-center

# 上传或克隆项目文件
# 方法 1: 使用 scp
# scp -r /path/to/project/* user@server:/opt/data-center/

# 方法 2: 使用 git
# git clone https://your-repo.git .

# 设置权限
sudo chown -R $USER:$USER /opt/data-center
```

#### 3.3 安装 Python 依赖

```bash
# 进入项目目录
cd /opt/data-center

# 创建虚拟环境
python3 -m venv api/venv

# 激活虚拟环境
source api/venv/bin/activate

# 升级 pip
pip install --upgrade pip

# 安装依赖
pip install -r api/requirements.txt

# 验证安装
python -c "import flask; print('Flask:', flask.__version__)"
python -c "import psycopg2; print('psycopg2:', psycopg2.__version__)"

# 退出虚拟环境
deactivate
```

---

### 第四步：配置应用

#### 4.1 创建配置文件

```bash
# 复制配置模板
cp api/.env.example api/.env

# 编辑配置
nano api/.env
```

配置内容：

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=data_center
```

#### 4.2 设置文件权限

```bash
# 保护配置文件
chmod 600 api/.env

# 设置脚本执行权限
chmod +x start-backend.sh
chmod +x start-frontend.sh
chmod +x start-all.sh
chmod +x stop-all.sh
```

---

### 第五步：初始化数据库

#### 5.1 创建表结构

```bash
# 使用 postgres 用户
sudo -u postgres psql -d data_center -f setup-database-postgresql.sql

# 或使用自定义用户
psql -U postgres -d data_center -f setup-database-postgresql.sql
```

#### 5.2 导入数据

```bash
# 确保 CSV 文件存在
ls -lh data/汇总.csv
ls -lh data/明细.csv

# 运行导入脚本
python3 import-csv-to-postgresql.py

# 或使用虚拟环境
api/venv/bin/python import-csv-to-postgresql.py
```

#### 5.3 验证数据

```bash
# 连接数据库
psql -U postgres -d data_center

# 查看表
\dt

# 查询数据
SELECT COUNT(*) FROM hz;
SELECT COUNT(*) FROM mx;

# 退出
\q
```

---

### 第六步：启动服务

#### 6.1 前台启动（测试）

```bash
# 启动后端
./start-backend.sh

# 在新终端启动前端
./start-frontend.sh

# 或同时启动
./start-all.sh
```

#### 6.2 后台启动

```bash
# 后台启动后端
nohup ./start-backend.sh > backend.log 2>&1 &

# 后台启动前端
nohup ./start-frontend.sh > frontend.log 2>&1 &

# 查看日志
tail -f backend.log
tail -f frontend.log
```

#### 6.3 使用 systemd 服务（推荐）

```bash
# 安装为系统服务
sudo ./install-systemd-service.sh

# 启动服务
sudo systemctl start data-center-api
sudo systemctl start data-center-frontend

# 设置开机自启
sudo systemctl enable data-center-api
sudo systemctl enable data-center-frontend

# 查看状态
sudo systemctl status data-center-api
sudo systemctl status data-center-frontend

# 查看日志
sudo journalctl -u data-center-api -f
```

---

### 第七步：配置 Nginx（可选）

#### 7.1 安装 Nginx

```bash
# 安装 Nginx
sudo apt install -y nginx

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 7.2 配置反向代理

```bash
# 复制配置文件
sudo cp nginx/data-center.conf /etc/nginx/sites-available/data-center

# 创建软链接
sudo ln -s /etc/nginx/sites-available/data-center /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

#### 7.3 配置防火墙

```bash
# 安装 ufw（如果没有）
sudo apt install -y ufw

# 允许 SSH
sudo ufw allow ssh

# 允许 HTTP 和 HTTPS
sudo ufw allow 'Nginx Full'

# 启用防火墙
sudo ufw enable

# 查看状态
sudo ufw status
```

---

### 第八步：验证部署

#### 8.1 测试 API

```bash
# 健康检查
curl http://localhost:5000/api/health

# 获取汇总数据
curl http://localhost:5000/api/summary

# 获取明细数据
curl http://localhost:5000/api/detail

# 如果使用 Nginx
curl http://your-domain.com/api/health
```

#### 8.2 访问前端

浏览器打开：
- 直接访问: http://your-server-ip:8000
- 通过 Nginx: http://your-domain.com

---

## 一键部署脚本

创建 `deploy-ubuntu.sh`:

```bash
#!/bin/bash

set -e

echo "========================================"
echo "Ubuntu 自动部署脚本"
echo "数据汇聚情况周报系统 - PostgreSQL 版本"
echo "========================================"
echo ""

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo "请使用 sudo 运行此脚本"
    exit 1
fi

# 获取实际用户
ACTUAL_USER=${SUDO_USER:-$USER}
PROJECT_DIR="/opt/data-center"

echo "步骤 1: 更新系统..."
apt update

echo ""
echo "步骤 2: 安装 PostgreSQL..."
apt install -y postgresql postgresql-contrib

systemctl start postgresql
systemctl enable postgresql

echo ""
echo "步骤 3: 安装 Python 和依赖..."
apt install -y python3 python3-pip python3-venv python3-dev libpq-dev build-essential

echo ""
echo "步骤 4: 创建项目目录..."
mkdir -p $PROJECT_DIR
chown -R $ACTUAL_USER:$ACTUAL_USER $PROJECT_DIR

echo ""
echo "步骤 5: 复制项目文件..."
# 假设脚本在项目目录中运行
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
if [ "$SCRIPT_DIR" != "$PROJECT_DIR" ]; then
    cp -r $SCRIPT_DIR/* $PROJECT_DIR/
    chown -R $ACTUAL_USER:$ACTUAL_USER $PROJECT_DIR
fi

cd $PROJECT_DIR

echo ""
echo "步骤 6: 创建虚拟环境..."
sudo -u $ACTUAL_USER python3 -m venv api/venv

echo ""
echo "步骤 7: 安装 Python 依赖..."
sudo -u $ACTUAL_USER api/venv/bin/pip install --upgrade pip
sudo -u $ACTUAL_USER api/venv/bin/pip install -r api/requirements.txt

echo ""
echo "步骤 8: 配置数据库..."
sudo -u postgres psql <<EOF
CREATE DATABASE data_center;
\q
EOF

echo ""
echo "步骤 9: 创建配置文件..."
if [ ! -f api/.env ]; then
    cp api/.env.example api/.env
    chown $ACTUAL_USER:$ACTUAL_USER api/.env
    chmod 600 api/.env
    echo "请编辑 api/.env 文件配置数据库连接"
fi

echo ""
echo "步骤 10: 初始化数据库..."
sudo -u postgres psql -d data_center -f setup-database-postgresql.sql

echo ""
echo "步骤 11: 导入数据..."
if [ -f data/汇总.csv ] && [ -f data/明细.csv ]; then
    sudo -u $ACTUAL_USER api/venv/bin/python import-csv-to-postgresql.py
else
    echo "⚠ 警告: 未找到 CSV 数据文件"
fi

echo ""
echo "步骤 12: 设置脚本权限..."
chmod +x start-backend.sh start-frontend.sh start-all.sh stop-all.sh

echo ""
echo "========================================"
echo "部署完成！"
echo "========================================"
echo ""
echo "下一步:"
echo "1. 编辑配置: nano $PROJECT_DIR/api/.env"
echo "2. 启动服务: cd $PROJECT_DIR && ./start-all.sh"
echo "3. 访问前端: http://$(hostname -I | awk '{print $1}'):8000"
echo ""
echo "可选:"
echo "- 安装为系统服务: sudo ./install-systemd-service.sh"
echo "- 配置 Nginx: 参考 nginx/data-center.conf"
echo ""
echo "========================================"
```

保存并运行：

```bash
chmod +x deploy-ubuntu.sh
sudo ./deploy-ubuntu.sh
```

---

## 常见问题

### Q1: PostgreSQL 安装失败

**错误**: `Unable to locate package postgresql`

**解决**:

```bash
# 添加 PostgreSQL 官方仓库
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install -y postgresql-14
```

### Q2: psycopg2 安装失败

**错误**: `Error: pg_config executable not found`

**解决**:

```bash
# 安装开发包
sudo apt install -y libpq-dev python3-dev build-essential

# 重新安装
pip install psycopg2-binary==2.8.6
```

### Q3: 权限被拒绝

**错误**: `Permission denied`

**解决**:

```bash
# 修改项目目录权限
sudo chown -R $USER:$USER /opt/data-center

# 修改配置文件权限
chmod 600 api/.env

# 修改脚本权限
chmod +x *.sh
```

### Q4: 端口被占用

**错误**: `Address already in use`

**解决**:

```bash
# 查看占用端口的进程
sudo lsof -i :5000
sudo lsof -i :8000

# 结束进程
sudo kill -9 PID

# 或使用 stop-all.sh
./stop-all.sh
```

### Q5: 防火墙阻止连接

**解决**:

```bash
# 检查防火墙状态
sudo ufw status

# 允许端口
sudo ufw allow 5000/tcp
sudo ufw allow 8000/tcp
sudo ufw allow 5432/tcp  # PostgreSQL

# 或允许 Nginx
sudo ufw allow 'Nginx Full'
```

---

## 性能优化

### 1. PostgreSQL 优化

编辑 `/etc/postgresql/14/main/postgresql.conf`:

```conf
# 内存设置（根据服务器配置调整）
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
work_mem = 16MB

# 连接设置
max_connections = 100

# 日志设置
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
```

重启 PostgreSQL:

```bash
sudo systemctl restart postgresql
```

### 2. 使用 Gunicorn

```bash
# 安装 Gunicorn
pip install gunicorn

# 启动（4 个 worker）
gunicorn -w 4 -b 0.0.0.0:5000 api.app:app

# 或使用配置文件
gunicorn -c gunicorn.conf.py api.app:app
```

创建 `gunicorn.conf.py`:

```python
bind = "0.0.0.0:5000"
workers = 4
worker_class = "sync"
timeout = 30
keepalive = 2
accesslog = "access.log"
errorlog = "error.log"
loglevel = "info"
```

### 3. 配置 Nginx 缓存

在 `nginx/data-center.conf` 中添加:

```nginx
# 缓存配置
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m;

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_key "$scheme$request_method$host$request_uri";
    add_header X-Cache-Status $upstream_cache_status;
    
    proxy_pass http://localhost:5000;
}
```

---

## 监控和维护

### 1. 查看日志

```bash
# 应用日志
tail -f backend.log
tail -f frontend.log

# PostgreSQL 日志
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Systemd 日志
sudo journalctl -u data-center-api -f
```

### 2. 数据库维护

```bash
# 连接数据库
psql -U postgres -d data_center

# 查看表大小
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public';

# 清理和优化
VACUUM ANALYZE hz;
VACUUM ANALYZE mx;

# 重建索引
REINDEX TABLE hz;
REINDEX TABLE mx;
```

### 3. 备份

```bash
# 创建备份脚本
cat > /opt/data-center/backup.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/opt/data-center/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份数据库
pg_dump -U postgres data_center > $BACKUP_DIR/data_center_$DATE.sql

# 压缩备份
gzip $BACKUP_DIR/data_center_$DATE.sql

# 删除 7 天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "备份完成: $BACKUP_DIR/data_center_$DATE.sql.gz"
EOF

chmod +x /opt/data-center/backup.sh

# 添加到 crontab（每天凌晨 2 点备份）
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/data-center/backup.sh") | crontab -
```

---

## 安全建议

1. **使用防火墙**
   ```bash
   sudo ufw enable
   sudo ufw allow ssh
   sudo ufw allow 'Nginx Full'
   ```

2. **限制数据库访问**
   - 只允许本地连接
   - 使用强密码
   - 定期更新密码

3. **使用 HTTPS**
   ```bash
   # 安装 Certbot
   sudo apt install -y certbot python3-certbot-nginx
   
   # 获取证书
   sudo certbot --nginx -d your-domain.com
   ```

4. **定期更新**
   ```bash
   sudo apt update
   sudo apt upgrade -y
   ```

5. **限制文件权限**
   ```bash
   chmod 600 api/.env
   chmod 700 api/venv
   ```

---

**部署完成！** 🎉

你的系统现在可以在 Ubuntu 上稳定运行了。
