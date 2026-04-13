# PostgreSQL 版本部署指南

## 概述

本系统已从 MySQL 迁移到 PostgreSQL。本指南介绍如何部署 PostgreSQL 版本。

---

## 前提条件

1. Python 3.7+
2. PostgreSQL 9.6+ (推荐 12+)
3. 已安装 PostgreSQL 客户端工具

---

## 第一步：安装 PostgreSQL

### CentOS/RHEL

```bash
# 安装 PostgreSQL 12
sudo yum install -y postgresql12-server postgresql12

# 初始化数据库
sudo /usr/pgsql-12/bin/postgresql-12-setup initdb

# 启动服务
sudo systemctl start postgresql-12
sudo systemctl enable postgresql-12
```

### Ubuntu/Debian

```bash
# 安装 PostgreSQL
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

---

## 第二步：配置 PostgreSQL

### 1. 切换到 postgres 用户

```bash
sudo -i -u postgres
```

### 2. 创建数据库和用户

```bash
# 进入 PostgreSQL 命令行
psql

# 创建数据库
CREATE DATABASE data_center;

# 创建用户（如果需要）
CREATE USER your_user WITH PASSWORD 'your_password';

# 授予权限
GRANT ALL PRIVILEGES ON DATABASE data_center TO your_user;

# 退出
\q
exit
```

### 3. 配置远程访问（如果需要）

编辑 `postgresql.conf`:

```bash
sudo vi /var/lib/pgsql/12/data/postgresql.conf
```

修改:

```
listen_addresses = '*'
```

编辑 `pg_hba.conf`:

```bash
sudo vi /var/lib/pgsql/12/data/pg_hba.conf
```

添加:

```
# 允许所有 IP 访问（生产环境请限制具体 IP）
host    all             all             0.0.0.0/0               md5
```

重启 PostgreSQL:

```bash
sudo systemctl restart postgresql-12
```

---

## 第三步：安装 Python 依赖

### 在线安装

```bash
# 进入项目目录
cd /path/to/dateQuality

# 创建虚拟环境
python3 -m venv api/venv

# 激活虚拟环境
source api/venv/bin/activate

# 安装依赖
pip install -r api/requirements.txt

# 退出虚拟环境
deactivate
```

### 离线安装

```bash
# 在有网络的机器上下载
./download-py37-packages.sh

# 传输到服务器
scp python-packages-py37.tar.gz user@server:/path/to/dateQuality/

# 在服务器上安装
tar -xzf python-packages-py37.tar.gz
./install-offline.sh
```

**注意**: PostgreSQL 需要 `psycopg2-binary` 包，确保 `requirements.txt` 中包含:

```
psycopg2-binary==2.8.6
```

---

## 第四步：配置数据库连接

### 1. 复制配置文件

```bash
cp api/.env.example api/.env
```

### 2. 编辑配置

```bash
vi api/.env
```

配置内容:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=data_center
```

---

## 第五步：初始化数据库

### 1. 创建表结构

```bash
# 方法 1: 使用 psql 命令
psql -U postgres -d data_center -f setup-database-postgresql.sql

# 方法 2: 使用 postgres 用户
sudo -u postgres psql -d data_center -f setup-database-postgresql.sql
```

### 2. 导入 CSV 数据

```bash
# 确保 CSV 文件存在
ls data/汇总.csv
ls data/明细.csv

# 运行导入脚本
python3 import-csv-to-postgresql.py

# 或使用虚拟环境中的 Python
api/venv/bin/python import-csv-to-postgresql.py
```

---

## 第六步：启动服务

### 启动后端 API

```bash
./start-backend.sh
```

### 启动前端服务

```bash
./start-frontend.sh
```

### 或同时启动

```bash
./start-all.sh
```

---

## 第七步：验证部署

### 1. 测试 API

```bash
# 健康检查
curl http://localhost:5000/api/health

# 获取汇总数据
curl http://localhost:5000/api/summary

# 获取明细数据
curl http://localhost:5000/api/detail
```

### 2. 访问前端

浏览器打开: `http://localhost:8000`

---

## MySQL 到 PostgreSQL 迁移说明

### 主要变更

1. **数据库驱动**: `pymysql` → `psycopg2-binary`
2. **默认端口**: `3306` → `5432`
3. **SQL 语法差异**:
   - 字符串引号: 单引号 `'` (MySQL 支持双引号，PostgreSQL 标识符用双引号)
   - 自增字段: `AUTO_INCREMENT` → `SERIAL`
   - 字符串连接: `CONCAT()` → `||`
   - 限制查询: `LIMIT` 语法相同
   - 日期时间: `NOW()` → `CURRENT_TIMESTAMP`

4. **别名语法**: 
   - MySQL: `AS '中文别名'`
   - PostgreSQL: `AS "中文别名"`

### 数据迁移

如果需要从 MySQL 迁移现有数据:

```bash
# 1. 从 MySQL 导出数据
mysqldump -u root -p data_center > mysql_backup.sql

# 2. 使用工具转换 SQL 语法
# 推荐工具: pgloader

# 3. 或使用 CSV 中间格式
# MySQL 导出 CSV
mysql -u root -p -e "SELECT * FROM hz INTO OUTFILE '/tmp/hz.csv' FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n';" data_center

# PostgreSQL 导入 CSV
psql -U postgres -d data_center -c "\COPY hz FROM '/tmp/hz.csv' WITH CSV HEADER"
```

---

## 常见问题

### Q1: psycopg2 安装失败

**错误**: `Error: pg_config executable not found`

**解决**:

```bash
# CentOS/RHEL
sudo yum install postgresql-devel python3-devel gcc

# Ubuntu/Debian
sudo apt install libpq-dev python3-dev gcc

# 或使用 psycopg2-binary (推荐)
pip install psycopg2-binary
```

### Q2: 连接被拒绝

**错误**: `could not connect to server: Connection refused`

**解决**:

1. 检查 PostgreSQL 是否运行:
   ```bash
   sudo systemctl status postgresql-12
   ```

2. 检查端口是否监听:
   ```bash
   sudo netstat -tlnp | grep 5432
   ```

3. 检查防火墙:
   ```bash
   sudo firewall-cmd --add-port=5432/tcp --permanent
   sudo firewall-cmd --reload
   ```

### Q3: 认证失败

**错误**: `FATAL: password authentication failed`

**解决**:

1. 检查 `pg_hba.conf` 配置
2. 确认用户密码正确
3. 重启 PostgreSQL

### Q4: 权限不足

**错误**: `permission denied for table`

**解决**:

```sql
-- 授予所有权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

---

## 性能优化建议

### 1. 创建索引

```sql
-- 已在 setup-database-postgresql.sql 中创建
CREATE INDEX idx_hz_bmmc ON hz(bmmc);
CREATE INDEX idx_mx_bm ON mx(bm);
```

### 2. 配置连接池

在生产环境中使用连接池（如 pgBouncer）

### 3. 调整 PostgreSQL 配置

编辑 `postgresql.conf`:

```
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
work_mem = 16MB
```

---

## 生产环境部署

### 使用 Gunicorn

```bash
# 安装 Gunicorn
pip install gunicorn

# 启动
gunicorn -w 4 -b 0.0.0.0:5000 api.app:app
```

### 使用 Nginx 反向代理

参考 `nginx/data-center.conf` 配置文件

### 使用 Systemd 服务

参考 `systemd/data-center-api.service` 配置文件

---

## 备份和恢复

### 备份数据库

```bash
# 备份整个数据库
pg_dump -U postgres data_center > backup.sql

# 备份特定表
pg_dump -U postgres -t hz -t mx data_center > tables_backup.sql
```

### 恢复数据库

```bash
# 恢复数据库
psql -U postgres data_center < backup.sql
```

---

## 监控和维护

### 查看连接数

```sql
SELECT count(*) FROM pg_stat_activity;
```

### 查看表大小

```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 清理和优化

```sql
-- 清理死元组
VACUUM ANALYZE hz;
VACUUM ANALYZE mx;

-- 重建索引
REINDEX TABLE hz;
REINDEX TABLE mx;
```

---

**部署完成！** 🎉

如有问题，请查看日志:
- PostgreSQL 日志: `/var/lib/pgsql/12/data/log/`
- 应用日志: `backend.log`
