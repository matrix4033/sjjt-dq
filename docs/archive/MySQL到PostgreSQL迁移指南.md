# MySQL 到 PostgreSQL 迁移快速指南

## 已完成的修改

✅ 1. **依赖包更新** (`api/requirements.txt`)
   - 移除: `pymysql==1.0.2`
   - 添加: `psycopg2-binary==2.8.6`

✅ 2. **API 代码更新** (`api/app.py`)
   - 导入: `pymysql` → `psycopg2`
   - 连接: 使用 `psycopg2.connect()`
   - 游标: 使用 `RealDictCursor`
   - SQL 别名: 单引号 `'` → 双引号 `"`

✅ 3. **数据库脚本**
   - 创建: `setup-database-postgresql.sql`
   - 创建: `import-csv-to-postgresql.py`

✅ 4. **配置文件**
   - 更新: `api/.env` (端口 3306 → 5432)
   - 创建: `api/.env.example`

✅ 5. **文档**
   - 创建: `PostgreSQL部署指南.md`
   - 创建: `MySQL到PostgreSQL迁移指南.md`

---

## 迁移步骤

### 步骤 1: 重新安装 Python 依赖

```bash
# 删除旧的虚拟环境
rm -rf api/venv

# 在有网络的机器上重新下载依赖
./download-py37-packages.sh

# 传输到服务器
scp python-packages-py37.tar.gz user@server:/path/to/dateQuality/

# 在服务器上安装
tar -xzf python-packages-py37.tar.gz
./install-offline.sh
```

### 步骤 2: 安装 PostgreSQL

```bash
# CentOS/RHEL
sudo yum install -y postgresql12-server postgresql12
sudo /usr/pgsql-12/bin/postgresql-12-setup initdb
sudo systemctl start postgresql-12
sudo systemctl enable postgresql-12

# Ubuntu/Debian
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 步骤 3: 创建数据库

```bash
# 切换到 postgres 用户
sudo -i -u postgres

# 创建数据库
createdb data_center

# 或使用 psql
psql
CREATE DATABASE data_center;
\q
exit
```

### 步骤 4: 更新配置文件

编辑 `api/.env`:

```bash
vi api/.env
```

内容:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=data_center
```

### 步骤 5: 初始化数据库

```bash
# 创建表结构
psql -U postgres -d data_center -f setup-database-postgresql.sql

# 导入数据
python3 import-csv-to-postgresql.py
```

### 步骤 6: 启动服务

```bash
# 停止旧服务
pkill -f "python.*api/app.py"

# 启动新服务
./start-all.sh
```

### 步骤 7: 验证

```bash
# 测试 API
curl http://localhost:5000/api/health
curl http://localhost:5000/api/summary
curl http://localhost:5000/api/detail

# 访问前端
# http://localhost:8000
```

---

## 主要差异对照

| 项目 | MySQL | PostgreSQL |
|------|-------|------------|
| Python 驱动 | pymysql | psycopg2-binary |
| 默认端口 | 3306 | 5432 |
| 默认用户 | root | postgres |
| 自增字段 | AUTO_INCREMENT | SERIAL |
| 字符串引号 | 单引号/双引号 | 单引号 |
| 标识符引号 | 反引号 \` | 双引号 " |
| 字符串连接 | CONCAT() | \|\| |
| 当前时间 | NOW() | CURRENT_TIMESTAMP |
| 限制查询 | LIMIT n | LIMIT n |
| 注释 | COMMENT '...' | COMMENT ON ... |

---

## SQL 语法转换示例

### 表创建

**MySQL:**
```sql
CREATE TABLE hz (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bmmc VARCHAR(100) NOT NULL COMMENT '部门名称'
);
```

**PostgreSQL:**
```sql
CREATE TABLE hz (
    id SERIAL PRIMARY KEY,
    bmmc VARCHAR(100) NOT NULL
);
COMMENT ON COLUMN hz.bmmc IS '部门名称';
```

### 查询别名

**MySQL:**
```sql
SELECT bmmc AS '部门名称' FROM hz;
```

**PostgreSQL:**
```sql
SELECT bmmc AS "部门名称" FROM hz;
```

### 更新时间触发器

**MySQL:**
```sql
CREATE TRIGGER update_time
BEFORE UPDATE ON hz
FOR EACH ROW
SET NEW.gxsj = NOW();
```

**PostgreSQL:**
```sql
CREATE OR REPLACE FUNCTION update_gxsj_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.gxsj = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hz_gxsj
BEFORE UPDATE ON hz
FOR EACH ROW
EXECUTE FUNCTION update_gxsj_column();
```

---

## 数据迁移选项

### 选项 1: 使用 CSV (推荐)

```bash
# 1. 从 MySQL 导出
mysql -u root -p data_center -e "SELECT * FROM hz" > hz.csv

# 2. 导入到 PostgreSQL
psql -U postgres -d data_center -c "\COPY hz FROM 'hz.csv' WITH CSV HEADER"
```

### 选项 2: 使用 pgloader

```bash
# 安装 pgloader
sudo yum install pgloader

# 迁移数据
pgloader mysql://root:password@localhost/data_center \
          postgresql://postgres:password@localhost/data_center
```

### 选项 3: 使用现有脚本

```bash
# 使用项目提供的导入脚本
python3 import-csv-to-postgresql.py
```

---

## 故障排除

### 问题 1: psycopg2 安装失败

```bash
# 安装开发包
sudo yum install postgresql-devel python3-devel gcc

# 或使用 binary 版本
pip install psycopg2-binary
```

### 问题 2: 连接被拒绝

```bash
# 检查服务状态
sudo systemctl status postgresql-12

# 检查端口
sudo netstat -tlnp | grep 5432

# 配置防火墙
sudo firewall-cmd --add-port=5432/tcp --permanent
sudo firewall-cmd --reload
```

### 问题 3: 认证失败

编辑 `/var/lib/pgsql/12/data/pg_hba.conf`:

```
# 添加
host    all             all             0.0.0.0/0               md5
```

重启:

```bash
sudo systemctl restart postgresql-12
```

---

## 回滚到 MySQL

如果需要回滚:

1. 恢复 `api/requirements.txt`:
   ```
   pymysql==1.0.2
   ```

2. 恢复 `api/app.py` (使用 git 或备份)

3. 恢复 `api/.env`:
   ```
   DB_PORT=3306
   DB_USER=root
   ```

4. 重新安装依赖:
   ```bash
   rm -rf api/venv
   ./install-offline.sh
   ```

---

## 性能对比

| 指标 | MySQL | PostgreSQL |
|------|-------|------------|
| 并发连接 | 较好 | 优秀 |
| 复杂查询 | 良好 | 优秀 |
| JSON 支持 | 5.7+ | 原生支持 |
| 全文搜索 | 支持 | 强大 |
| 事务支持 | InnoDB | MVCC |
| 扩展性 | 良好 | 优秀 |

---

**迁移完成！** 🎉

PostgreSQL 提供了更强大的功能和更好的并发性能。
