# Ubuntu 快速部署

## 🚀 一键部署

```bash
# 1. 上传项目文件到服务器
scp -r /path/to/project/* user@server:/tmp/data-center/

# 2. 登录服务器
ssh user@server

# 3. 运行部署脚本
cd /tmp/data-center
chmod +x deploy-ubuntu.sh
sudo ./deploy-ubuntu.sh
```

---

## 📝 手动部署（5 分钟）

### 1. 安装依赖

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib python3 python3-pip python3-venv python3-dev libpq-dev build-essential
```

### 2. 配置数据库

```bash
sudo -u postgres psql
CREATE DATABASE data_center;
\q
```

### 3. 安装 Python 依赖

```bash
cd /path/to/project
python3 -m venv api/venv
source api/venv/bin/activate
pip install -r api/requirements.txt
deactivate
```

### 4. 配置应用

```bash
cp api/.env.example api/.env
nano api/.env  # 编辑数据库配置
```

### 5. 初始化数据

```bash
sudo -u postgres psql -d data_center -f setup-database-postgresql.sql
python3 import-csv-to-postgresql.py
```

### 6. 启动服务

```bash
./start-all.sh
```

---

## ✅ 验证部署

```bash
# 测试 API
curl http://localhost:5000/api/health

# 查看日志
tail -f backend.log

# 访问前端
# http://your-server-ip:8000
```

---

## 🔧 常用命令

```bash
# 启动服务
./start-all.sh

# 停止服务
./stop-all.sh

# 查看日志
tail -f backend.log
tail -f frontend.log

# 重启服务
./stop-all.sh && ./start-all.sh

# 查看数据库
psql -U postgres -d data_center
```

---

## 📦 系统服务（可选）

```bash
# 安装为系统服务
sudo ./install-systemd-service.sh

# 管理服务
sudo systemctl start data-center-api
sudo systemctl stop data-center-api
sudo systemctl status data-center-api
sudo systemctl enable data-center-api  # 开机自启
```

---

## 🌐 Nginx 配置（可选）

```bash
# 安装 Nginx
sudo apt install -y nginx

# 配置反向代理
sudo cp nginx/data-center.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/data-center.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 配置防火墙
sudo ufw allow 'Nginx Full'
```

---

## 🐛 故障排除

### 问题 1: psycopg2 安装失败

```bash
sudo apt install -y libpq-dev python3-dev build-essential
pip install psycopg2-binary==2.8.6
```

### 问题 2: 数据库连接失败

```bash
# 检查 PostgreSQL 状态
sudo systemctl status postgresql

# 检查配置
cat api/.env

# 测试连接
psql -U postgres -d data_center
```

### 问题 3: 端口被占用

```bash
# 查看占用端口的进程
sudo lsof -i :5000
sudo lsof -i :8000

# 停止服务
./stop-all.sh
```

---

## 📊 性能优化

### 使用 Gunicorn

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 api.app:app
```

### PostgreSQL 优化

```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

添加:

```conf
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 16MB
```

重启:

```bash
sudo systemctl restart postgresql
```

---

## 🔒 安全建议

```bash
# 启用防火墙
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# 保护配置文件
chmod 600 api/.env

# 使用 HTTPS
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 📚 完整文档

- **Ubuntu部署指南.md** - 详细部署步骤
- **PostgreSQL部署指南.md** - 数据库配置
- **PostgreSQL迁移总结.md** - 从 MySQL 迁移

---

**快速开始，5 分钟部署完成！** 🎉
