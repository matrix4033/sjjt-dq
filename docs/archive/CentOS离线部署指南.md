# CentOS 离线部署指南

## 完整流程

---

## 阶段 1：在有网络的机器上准备

### 方法 1：在相同版本的 CentOS 上下载（推荐）

```bash
# 1. 下载 Python 依赖包
pip3 download -r api/requirements.txt -d offline-packages/

# 2. 查看下载的包
ls -lh offline-packages/

# 3. 打包
tar -czf python-packages.tar.gz offline-packages/
```

### 方法 2：在任意 Linux 上下载（通用）

```bash
# 指定平台下载（适用于 CentOS 7/8）
pip3 download -r api/requirements.txt \
    -d offline-packages/ \
    --platform manylinux2014_x86_64 \
    --python-version 3.6 \
    --only-binary=:all:

# 如果有纯 Python 包（无二进制依赖）
pip3 download -r api/requirements.txt -d offline-packages/
```

### 方法 3：使用 Docker 下载（最可靠）

```bash
# 使用 CentOS 容器下载
docker run --rm -v $(pwd):/workspace centos:7 bash -c "
    yum install -y python3 python3-pip && \
    pip3 download -r /workspace/api/requirements.txt -d /workspace/offline-packages/
"

# 打包
tar -czf python-packages.tar.gz offline-packages/
```

---

## 阶段 2：传输到 CentOS 离线机器

```bash
# 使用 scp
scp python-packages.tar.gz user@centos-server:/tmp/

# 或使用 U 盘、FTP 等方式
```

---

## 阶段 3：在 CentOS 离线机器上安装

### 步骤 1：检查 Python 环境

```bash
# 检查 Python 版本
python3 --version

# 如果没有 python3，需要从 RPM 包安装
# CentOS 7:
sudo yum install python3

# CentOS 8:
sudo dnf install python3
```

### 步骤 2：解压依赖包

```bash
# 解压
tar -xzf python-packages.tar.gz

# 查看内容
ls offline-packages/
```

### 步骤 3：创建虚拟环境

```bash
# 创建虚拟环境
python3 -m venv api/venv

# 如果报错，需要安装 python3-venv
# CentOS 7/8 通常自带，如果没有：
# sudo yum install python3-venv
```

### 步骤 4：激活虚拟环境

```bash
# 激活
source api/venv/bin/activate

# 或
. api/venv/bin/activate

# 确认激活（命令行前面会显示 (venv)）
which python
```

### 步骤 5：离线安装依赖

```bash
# 从离线包安装
pip install --no-index --find-links=offline-packages/ -r api/requirements.txt

# 验证安装
pip list

# 测试导入
python -c "import flask, pymysql, dotenv, flask_cors"
```

### 步骤 6：退出虚拟环境

```bash
deactivate
```

---

## 完整的自动化脚本（CentOS 版）

创建 `install-centos-offline.sh`：

```bash
#!/bin/bash

echo "========================================"
echo "CentOS 离线安装脚本"
echo "========================================"
echo ""

# 检查 Python3
if ! command -v python3 &> /dev/null; then
    echo "✗ 错误: 未找到 Python3"
    echo "请先安装: sudo yum install python3"
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "Python 版本: $PYTHON_VERSION"
echo ""

# 检查离线包
if [ ! -d "offline-packages" ]; then
    echo "✗ 错误: 未找到 offline-packages 目录"
    echo "请先解压: tar -xzf python-packages.tar.gz"
    exit 1
fi

echo "步骤 1: 创建虚拟环境..."
if [ -d "api/venv" ]; then
    echo "删除旧的虚拟环境..."
    rm -rf api/venv
fi

python3 -m venv api/venv

if [ $? -ne 0 ]; then
    echo "✗ 虚拟环境创建失败"
    exit 1
fi

echo "✓ 虚拟环境创建成功"
echo ""

echo "步骤 2: 安装依赖..."
source api/venv/bin/activate

# 离线安装
pip install --no-index --find-links=offline-packages/ -r api/requirements.txt

if [ $? -ne 0 ]; then
    echo "✗ 依赖安装失败"
    deactivate
    exit 1
fi

echo "✓ 依赖安装完成"
echo ""

echo "步骤 3: 验证安装..."
python -c "import flask, pymysql, dotenv, flask_cors" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✓ 所有依赖验证通过"
else
    echo "✗ 依赖验证失败"
    deactivate
    exit 1
fi

deactivate
echo ""

echo "步骤 4: 设置脚本权限..."
chmod +x start-backend.sh start-frontend.sh start-all.sh stop-all.sh
echo "✓ 权限设置完成"
echo ""

echo "========================================"
echo "✓ 安装完成！"
echo "========================================"
echo ""
echo "下一步："
echo "1. 配置数据库: nano api/.env"
echo "2. 初始化数据库: mysql -u root -p < setup-database.sql"
echo "3. 导入数据: api/venv/bin/python import-csv-to-mysql.py"
echo "4. 启动服务: ./start-all.sh"
echo ""
```

---

## 手动安装步骤（详细版）

### 1. 准备工作

```bash
# 进入项目目录
cd /path/to/project

# 解压依赖包
tar -xzf python-packages.tar.gz

# 查看包列表
ls offline-packages/
```

### 2. 创建虚拟环境

```bash
# 创建
python3 -m venv api/venv

# 验证
ls api/venv/bin/
# 应该看到: python, pip, activate 等
```

### 3. 激活虚拟环境

```bash
# 激活
source api/venv/bin/activate

# 验证（命令行前面会显示 (venv)）
(venv) [user@centos project]$

# 检查 Python 路径
which python
# 应该显示: /path/to/project/api/venv/bin/python
```

### 4. 安装依赖

```bash
# 方式 1: 从 requirements.txt 安装（推荐）
pip install --no-index --find-links=offline-packages/ -r api/requirements.txt

# 方式 2: 安装单个包
pip install --no-index --find-links=offline-packages/ Flask
pip install --no-index --find-links=offline-packages/ pymysql
pip install --no-index --find-links=offline-packages/ python-dotenv
pip install --no-index --find-links=offline-packages/ Flask-Cors

# 方式 3: 安装所有 .whl 文件
pip install --no-index --find-links=offline-packages/ offline-packages/*.whl
```

### 5. 验证安装

```bash
# 查看已安装的包
pip list

# 应该看到:
# Flask          3.0.0
# pymysql        1.1.0
# python-dotenv  1.0.0
# Flask-Cors     4.0.0
# ... (及其依赖)

# 测试导入
python -c "import flask; print(flask.__version__)"
python -c "import pymysql; print(pymysql.__version__)"
python -c "import dotenv"
python -c "import flask_cors"
```

### 6. 退出虚拟环境

```bash
deactivate
```

---

## CentOS 特殊注意事项

### 1. SELinux 问题

如果遇到权限问题：

```bash
# 临时关闭 SELinux
sudo setenforce 0

# 或永久关闭（不推荐）
sudo vi /etc/selinux/config
# 修改: SELINUX=disabled
```

### 2. 防火墙配置

```bash
# 开放端口
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload

# 或临时关闭防火墙（测试用）
sudo systemctl stop firewalld
```

### 3. Python 版本问题

CentOS 7 默认 Python 版本较老：

```bash
# 检查版本
python3 --version

# 如果版本太老（< 3.6），需要安装新版本
# 方法 1: 使用 EPEL 仓库
sudo yum install epel-release
sudo yum install python36

# 方法 2: 使用 SCL (Software Collections)
sudo yum install centos-release-scl
sudo yum install rh-python38
scl enable rh-python38 bash
```

### 4. MySQL 安装（CentOS）

```bash
# CentOS 7
sudo yum install mariadb-server mariadb
sudo systemctl start mariadb
sudo systemctl enable mariadb
sudo mysql_secure_installation

# CentOS 8
sudo dnf install mysql-server
sudo systemctl start mysqld
sudo systemctl enable mysqld
```

---

## 常见错误及解决

### 错误 1: `No module named '_ctypes'`

```bash
# 安装 libffi-devel
sudo yum install libffi-devel

# 重新创建虚拟环境
rm -rf api/venv
python3 -m venv api/venv
```

### 错误 2: `pip: command not found`

```bash
# 安装 pip
sudo yum install python3-pip

# 或使用 ensurepip
python3 -m ensurepip --default-pip
```

### 错误 3: 依赖包版本不兼容

```bash
# 在有网络的机器上，指定 Python 版本下载
pip3 download -r api/requirements.txt \
    -d offline-packages/ \
    --python-version 3.6  # 改为目标 CentOS 的 Python 版本
```

### 错误 4: `error: invalid command 'bdist_wheel'`

某些包需要编译，离线环境无法编译。解决方法：

```bash
# 在有网络的机器上，只下载预编译的 wheel 包
pip3 download -r api/requirements.txt \
    -d offline-packages/ \
    --only-binary=:all:
```

---

## 完整部署检查清单

- [ ] Python 3.6+ 已安装
- [ ] python3-venv 已安装
- [ ] MySQL/MariaDB 已安装并启动
- [ ] 离线包已传输到服务器
- [ ] 离线包已解压
- [ ] 虚拟环境已创建
- [ ] 依赖已安装
- [ ] 依赖验证通过
- [ ] api/.env 已配置
- [ ] 数据库已初始化
- [ ] 数据已导入
- [ ] 防火墙端口已开放
- [ ] 服务已启动
- [ ] 可以访问页面

---

## 快速命令参考

```bash
# 1. 解压
tar -xzf python-packages.tar.gz

# 2. 创建虚拟环境
python3 -m venv api/venv

# 3. 安装依赖
source api/venv/bin/activate
pip install --no-index --find-links=offline-packages/ -r api/requirements.txt
deactivate

# 4. 配置
cp api/.env.example api/.env
nano api/.env

# 5. 初始化数据库
mysql -u root -p < setup-database.sql

# 6. 导入数据
api/venv/bin/python import-csv-to-mysql.py

# 7. 启动
./start-all.sh
```

---

**部署成功！** 🎉
