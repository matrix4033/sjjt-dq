# 数据汇聚情况周报系统

基于 Flask + PostgreSQL 的数据可视化系统，用于展示和管理数据汇聚情况。

---

## ✨ 特性

- 📊 **数据可视化** - 使用 D3.js 展示汇总和明细数据
- 🔄 **实时更新** - 支持数据的实时查询和展示
- 🗄️ **PostgreSQL** - 使用 PostgreSQL 数据库，性能优异
- 🚀 **易于部署** - 提供多平台一键部署脚本
- 📱 **响应式设计** - 支持桌面和移动设备访问

---

## 🚀 快速开始

### Ubuntu (推荐)

```bash
chmod +x deploy-ubuntu.sh
sudo ./deploy-ubuntu.sh
```

### Windows

```cmd
install-windows.bat
```

### CentOS (离线)

```bash
./download-py37-packages.sh  # 在有网络的机器上
./install-offline.sh          # 在目标服务器上
```

---

## 📚 文档

### 快速指南

- [Docker部署完整指南](Docker部署完整指南.md) - Docker 容器化部署
- [Ubuntu快速部署](Ubuntu快速部署.md) - Ubuntu 快速部署
- [部署指南总览](部署指南总览.md) - 所有部署选项

### 历史文档

旧版部署文档已归档至 `docs/archive/` 目录
- [MySQL到PostgreSQL迁移指南](MySQL到PostgreSQL迁移指南.md) - 数据库迁移
- [Python3.7离线安装完整指南](Python3.7离线安装完整指南.md) - Python 3.7 兼容

---

## 🛠️ 技术栈

### 后端

- **Python** 3.7+
- **Flask** 2.0.3
- **psycopg2-binary** 2.8.6
- **flask-cors** 3.0.10

### 数据库

- **PostgreSQL** 12+

### 前端

- **HTML5 + JavaScript**
- **D3.js** v7
- **Sankey 图表**

---

## 📋 系统要求

### 最低配置

- CPU: 2 核
- 内存: 2GB
- 磁盘: 10GB
- 操作系统: Ubuntu 18.04+ / CentOS 7+ / Windows 10+

### 推荐配置

- CPU: 4 核
- 内存: 4GB
- 磁盘: 20GB
- 操作系统: Ubuntu 20.04/22.04 LTS

---

## 🔧 安装步骤

### 1. 安装 PostgreSQL

```bash
# Ubuntu
sudo apt install -y postgresql postgresql-contrib

# CentOS
sudo yum install -y postgresql12-server postgresql12
```

### 2. 创建数据库

```bash
sudo -u postgres psql
CREATE DATABASE data_center;
\q
```

### 3. 安装 Python 依赖

```bash
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
psql -U postgres -d data_center -f setup-database-postgresql.sql
python3 import-csv-to-postgresql.py
```

### 6. 启动服务

```bash
./start-all.sh
```

---

## 🌐 访问地址

- **前端**: http://localhost:8000
- **API**: http://localhost:5000/api/health

---

## 📁 项目结构

```
.
├── api/                      # 后端 API
│   ├── app.py               # Flask 应用
│   ├── requirements.txt     # Python 依赖
│   └── .env                 # 环境配置 (不提交)
├── js/                       # 前端 JavaScript 模块
├── css/                      # 样式文件
├── data/                     # CSV 样本数据
├── docs/                     # 实现文档
│   └── archive/              # 历史归档文档
├── nginx/                    # Nginx 配置
├── systemd/                  # Systemd 服务配置
├── Dockerfile                # 主 Docker 镜像配置
├── Dockerfile.reference.*    # 参考配置 (多种架构/场景)
├── docker-compose.yml        # Docker Compose 配置
├── index.html                # 主页面
├── login.html                # 登录页面
├── start-all.sh             # 启动脚本
└── README.md                # 本文件
```

---

## 🔍 API 端点

### GET /

返回 API 信息

### GET /api/health

健康检查

**响应示例**:
```json
{
  "success": true,
  "message": "API 服务运行正常，数据库连接成功"
}
```

### GET /api/summary

获取汇总数据

**响应示例**:
```json
{
  "success": true,
  "data": [...],
  "count": 10
}
```

### GET /api/detail

获取明细数据

**响应示例**:
```json
{
  "success": true,
  "data": [...],
  "count": 100
}
```

---

## 🛡️ 生产环境部署

### 使用 Systemd 服务

```bash
sudo ./install-systemd-service.sh
sudo systemctl enable data-center-api
sudo systemctl start data-center-api
```

### 配置 Nginx

```bash
sudo cp nginx/data-center.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/data-center.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 启用 HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🐛 故障排除

### 数据库连接失败

```bash
# 检查 PostgreSQL 状态
sudo systemctl status postgresql

# 检查配置
cat api/.env

# 测试连接
psql -U postgres -d data_center
```

### Python 依赖安装失败

```bash
# 安装开发工具
sudo apt install -y python3-dev libpq-dev build-essential

# 重新安装
pip install -r api/requirements.txt
```

### 端口被占用

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

编辑 `/etc/postgresql/14/main/postgresql.conf`:

```conf
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 16MB
```

---

## 🔄 更新

```bash
git pull
./stop-all.sh
source api/venv/bin/activate
pip install -r api/requirements.txt --upgrade
deactivate
./start-all.sh
```

---

## 📝 版本历史

### v2.0.0 (2025-12-08)

- ✨ 迁移到 PostgreSQL
- ✨ 添加一键部署脚本
- ✨ 完善文档
- 🐛 修复 Python 3.7 兼容性问题

### v1.0.0

- 🎉 初始版本
- 使用 MySQL 数据库

---

## 📄 许可证

MIT License

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📞 联系方式

如有问题，请查看文档或提交 Issue。

---

**快速开始，立即部署！** 🚀
