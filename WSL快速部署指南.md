# WSL 快速部署指南

## 前提条件

确保 WSL 中已安装：
- Python 3
- MySQL

---

## 快速部署步骤

### 1. 检查 MySQL 服务

```bash
# 启动 MySQL 服务
sudo service mysql start

# 检查状态
sudo service mysql status
```

### 2. 初始化数据库

```bash
# 创建数据库和表
mysql -u root -p < setup-database.sql

# 如果需要修改表结构
mysql -u root -p < update-table-structure.sql
```

### 3. 配置环境变量

```bash
# 确保 api/.env 文件存在并配置正确
cat api/.env
```

应该包含：
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的MySQL密码
DB_NAME=data_center
```

### 4. 导入数据

```bash
# 导入 CSV 数据到 MySQL
python3 import-csv-to-mysql.py
```

### 5. 启动服务

```bash
# 给脚本添加执行权限
chmod +x start-all.sh start-backend.sh start-frontend.sh stop-all.sh

# 启动所有服务
./start-all.sh
```

### 6. 访问系统

在 Windows 浏览器中访问：
```
http://localhost:8000
```

---

## 常用命令

### 启动服务
```bash
./start-all.sh          # 一键启动所有服务
./start-backend.sh      # 只启动后端
./start-frontend.sh     # 只启动前端
```

### 停止服务
```bash
./stop-all.sh           # 停止所有服务
# 或按 Ctrl+C 停止当前服务
```

### 查看日志
```bash
tail -f backend.log     # 查看后端日志
tail -f frontend.log    # 查看前端日志
```

### 重新导入数据
```bash
python3 import-csv-to-mysql.py
```

---

## WSL 特殊说明

### 1. MySQL 服务管理

WSL 中 MySQL 不会自动启动，每次重启 WSL 后需要手动启动：

```bash
sudo service mysql start
```

### 2. 端口访问

WSL 的端口会自动映射到 Windows，所以可以直接在 Windows 浏览器访问 `localhost:8000`

### 3. 文件路径

WSL 中可以访问 Windows 文件：
- Windows C盘: `/mnt/c/`
- Windows D盘: `/mnt/d/`

### 4. 性能优化

如果项目在 Windows 文件系统（/mnt/c/）中，建议移动到 WSL 文件系统（~/ 或 /home/）以获得更好的性能：

```bash
# 复制项目到 WSL 文件系统
cp -r /mnt/c/your-project ~/data-center
cd ~/data-center
```

---

## 常见问题

### 问题 1: MySQL 连接失败

```bash
# 检查 MySQL 是否运行
sudo service mysql status

# 启动 MySQL
sudo service mysql start

# 重置 root 密码（如果需要）
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'new_password';
FLUSH PRIVILEGES;
EXIT;
```

### 问题 2: 端口被占用

```bash
# 查找占用端口的进程
lsof -i :5000
lsof -i :8000

# 杀死进程
kill -9 <PID>
```

### 问题 3: 权限问题

```bash
# 给脚本添加执行权限
chmod +x *.sh

# 修改文件所有者
sudo chown -R $USER:$USER .
```

### 问题 4: Python 模块未找到

```bash
# 激活虚拟环境
source api/venv/bin/activate

# 安装依赖
pip install -r api/requirements.txt
```

---

## 一键启动脚本（推荐）

创建一个启动脚本 `wsl-start.sh`：

```bash
#!/bin/bash

echo "========================================"
echo "WSL 环境启动脚本"
echo "========================================"
echo ""

# 1. 启动 MySQL
echo "启动 MySQL 服务..."
sudo service mysql start

# 等待 MySQL 启动
sleep 2

# 2. 检查 MySQL 状态
if sudo service mysql status | grep -q "running"; then
    echo "✓ MySQL 服务已启动"
else
    echo "✗ MySQL 启动失败"
    exit 1
fi

echo ""

# 3. 启动应用服务
echo "启动应用服务..."
./start-all.sh
```

使用方法：
```bash
chmod +x wsl-start.sh
./wsl-start.sh
```

---

## 测试完成后

如果测试成功，可以将项目部署到真实的 Linux 服务器：

1. 打包项目：
```bash
tar -czf data-center.tar.gz .
```

2. 上传到服务器：
```bash
scp data-center.tar.gz user@server:/path/to/destination/
```

3. 在服务器上解压并部署：
```bash
tar -xzf data-center.tar.gz
cd data-center
./deploy-linux.sh
```

---

**祝测试顺利！** 🎉
