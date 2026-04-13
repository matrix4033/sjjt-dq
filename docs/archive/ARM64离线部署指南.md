# ARM64 (aarch64) 离线部署指南

## 系统信息

- **架构**: aarch64 (ARM64)
- **系统**: UOS/EulerOS (统信/欧拉)
- **内核**: Linux 4.19.90

⚠️ **重要**: ARM64 架构需要下载专门的 ARM64 版本依赖包！

---

## 阶段 1：在有网络的机器上准备（关键步骤）

### 方法 1：在 ARM64 机器上下载（最可靠）

如果你有另一台能联网的 ARM64 机器：

```bash
# 在 ARM64 机器上下载
pip3 download -r api/requirements.txt -d offline-packages/

# 打包
tar -czf python-packages-arm64.tar.gz offline-packages/
```

### 方法 2：在 x86_64 机器上下载 ARM64 包（推荐）

```bash
# 创建目录
mkdir -p offline-packages

# 下载 ARM64 版本的包
pip3 download -r api/requirements.txt \
    -d offline-packages/ \
    --platform manylinux2014_aarch64 \
    --platform linux_aarch64 \
    --no-deps

# 下载纯 Python 包（无架构限制）
pip3 download -r api/requirements.txt \
    -d offline-packages/ \
    --only-binary=:none:

# 或者下载所有可能的包
pip3 download -r api/requirements.txt \
    -d offline-packages/ \
    --platform manylinux2014_aarch64

# 打包
tar -czf python-packages-arm64.tar.gz offline-packages/
```

### 方法 3：使用 Docker 模拟 ARM64 环境（最准确）

```bash
# 使用 ARM64 容器下载
docker run --rm --platform linux/arm64 \
    -v $(pwd):/workspace \
    arm64v8/python:3.8 \
    bash -c "pip3 download -r /workspace/api/requirements.txt -d /workspace/offline-packages/"

# 打包
tar -czf python-packages-arm64.tar.gz offline-packages/
```

### 方法 4：手动下载（最保险）

访问 PyPI 手动下载 ARM64 版本：

```bash
# 访问 https://pypi.org/
# 搜索每个包，下载 aarch64 或 arm64 版本

# 需要下载的包：
# - Flask-3.0.0-py3-none-any.whl (纯 Python，无架构限制)
# - pymysql-1.1.0-py3-none-any.whl (纯 Python)
# - python-dotenv-1.0.0-py3-none-any.whl (纯 Python)
# - Flask-Cors-4.0.0-py2.py3-none-any.whl (纯 Python)
# - 及其依赖...
```

---

## 阶段 2：验证下载的包

```bash
# 查看下载的包
ls -lh offline-packages/

# 检查架构
for file in offline-packages/*.whl; do
    echo "$file"
    unzip -l "$file" | grep -E "\.so|\.dylib" || echo "  纯 Python 包"
done
```

---

## 阶段 3：传输到 ARM64 离线机器

```bash
# 使用 scp
scp python-packages-arm64.tar.gz user@arm-server:/tmp/

# 或使用 U 盘、FTP 等
```

---

## 阶段 4：在 ARM64 机器上安装

### 步骤 1：检查系统信息

```bash
# 检查架构
uname -m
# 应该显示: aarch64

# 检查系统版本
cat /etc/os-release

# 检查 Python 版本
python3 --version
```

### 步骤 2：解压依赖包

```bash
# 解压
tar -xzf python-packages-arm64.tar.gz

# 查看内容
ls offline-packages/
```

### 步骤 3：创建虚拟环境

```bash
# 创建虚拟环境
python3 -m venv api/venv

# 如果报错，安装 python3-venv
# UOS/EulerOS:
sudo yum install python3-devel python3-pip

# 或
sudo dnf install python3-devel python3-pip
```

### 步骤 4：安装依赖

```bash
# 激活虚拟环境
source api/venv/bin/activate

# 离线安装
pip install --no-index --find-links=offline-packages/ -r api/requirements.txt

# 如果报错，尝试逐个安装
pip install --no-index --find-links=offline-packages/ Flask
pip install --no-index --find-links=offline-packages/ pymysql
pip install --no-index --find-links=offline-packages/ python-dotenv
pip install --no-index --find-links=offline-packages/ Flask-Cors

# 验证
pip list
python -c "import flask, pymysql, dotenv, flask_cors"

# 退出虚拟环境
deactivate
```

---

## ARM64 专用安装脚本

创建 `install-arm64-offline.sh`：

```bash
#!/bin/bash

echo "========================================"
echo "ARM64 离线安装脚本"
echo "========================================"
echo ""

# 检查架构
ARCH=$(uname -m)
if [ "$ARCH" != "aarch64" ]; then
    echo "⚠ 警告: 当前架构是 $ARCH，不是 aarch64"
    echo "此脚本专为 ARM64 设计"
    read -p "是否继续? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "架构: $ARCH"
echo ""

# 检查系统
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo "系统: $NAME $VERSION"
fi
echo ""

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "✗ 错误: 未找到 Python3"
    echo "安装: sudo yum install python3"
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "Python: $PYTHON_VERSION"
echo ""

# 检查离线包
if [ ! -d "offline-packages" ]; then
    echo "✗ 错误: 未找到 offline-packages 目录"
    exit 1
fi

echo "步骤 1: 创建虚拟环境..."
rm -rf api/venv
python3 -m venv api/venv

if [ $? -ne 0 ]; then
    echo "✗ 虚拟环境创建失败"
    echo "尝试安装: sudo yum install python3-devel gcc"
    exit 1
fi

echo "✓ 虚拟环境创建成功"
echo ""

echo "步骤 2: 安装依赖..."
source api/venv/bin/activate

# 尝试安装
pip install --no-index --find-links=offline-packages/ -r api/requirements.txt

if [ $? -ne 0 ]; then
    echo "⚠ 批量安装失败，尝试逐个安装..."
    
    # 逐个安装核心依赖
    for pkg in Flask pymysql python-dotenv Flask-Cors; do
        echo "安装 $pkg..."
        pip install --no-index --find-links=offline-packages/ $pkg
    done
fi

echo ""
echo "步骤 3: 验证安装..."
python -c "import flask, pymysql, dotenv, flask_cors" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✓ 所有依赖验证通过"
    pip list
else
    echo "✗ 依赖验证失败"
    echo "已安装的包:"
    pip list
    deactivate
    exit 1
fi

deactivate
echo ""

chmod +x start-*.sh stop-all.sh
echo "✓ 安装完成！"
echo ""
echo "下一步:"
echo "1. 配置: vi api/.env"
echo "2. 初始化: mysql -u root -p < setup-database.sql"
echo "3. 导入: api/venv/bin/python import-csv-to-mysql.py"
echo "4. 启动: ./start-all.sh"
```

---

## 特别注意事项

### 1. 纯 Python 包 vs 二进制包

好消息：你的项目依赖都是**纯 Python 包**，无需编译！

```
Flask          ✓ 纯 Python
pymysql        ✓ 纯 Python  
python-dotenv  ✓ 纯 Python
Flask-Cors     ✓ 纯 Python
```

这意味着架构兼容性问题较小。

### 2. 如果遇到二进制依赖

某些包可能有 C 扩展，需要 ARM64 版本：

```bash
# 在有网络的机器上
pip3 download package-name \
    --platform manylinux2014_aarch64 \
    --only-binary=:all:
```

### 3. UOS/EulerOS 特殊配置

```bash
# 安装开发工具
sudo yum groupinstall "Development Tools"
sudo yum install python3-devel libffi-devel openssl-devel

# 或
sudo dnf groupinstall "Development Tools"
sudo dnf install python3-devel libffi-devel openssl-devel
```

---

## 完整部署命令（ARM64）

```bash
# 1. 解压
tar -xzf python-packages-arm64.tar.gz

# 2. 创建虚拟环境
python3 -m venv api/venv

# 3. 激活并安装
source api/venv/bin/activate
pip install --no-index --find-links=offline-packages/ -r api/requirements.txt
deactivate

# 4. 验证
api/venv/bin/python -c "import flask, pymysql, dotenv, flask_cors"

# 5. 配置
cp api/.env.example api/.env
vi api/.env

# 6. 初始化数据库
mysql -u root -p < setup-database.sql

# 7. 导入数据
api/venv/bin/python import-csv-to-mysql.py

# 8. 启动
./start-all.sh
```

---

## 故障排查

### 问题 1: 找不到匹配的包

```
ERROR: Could not find a version that satisfies the requirement
```

**原因**: 下载的包不是 ARM64 版本

**解决**: 重新下载，指定 `--platform manylinux2014_aarch64`

### 问题 2: 编译错误

```
error: command 'gcc' failed
```

**解决**:
```bash
sudo yum install gcc python3-devel
```

### 问题 3: 缺少系统库

```
ImportError: libffi.so.6: cannot open shared object file
```

**解决**:
```bash
sudo yum install libffi-devel
```

---

## 推荐下载方案（最终版）

在有网络的 x86_64 机器上：

```bash
#!/bin/bash
# download-arm64-packages.sh

mkdir -p offline-packages

# 下载纯 Python 包（无架构限制）
pip3 download Flask pymysql python-dotenv Flask-Cors \
    -d offline-packages/

# 下载所有依赖
pip3 download -r api/requirements.txt \
    -d offline-packages/

# 打包
tar -czf python-packages-arm64.tar.gz offline-packages/

echo "✓ ARM64 离线包准备完成"
ls -lh python-packages-arm64.tar.gz
```

---

**部署成功！** 🎉

ARM64 架构部署完成后，系统运行方式与 x86_64 完全相同。
