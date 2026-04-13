# Python 3.7 离线安装完整指南

## 问题说明

Python 3.7 环境下安装 Flask 时遇到依赖版本不兼容问题：
- `itsdangerous 2.2.0` 需要 Python 3.8+
- `click 8.3+` 需要 Python 3.10+

## 解决方案

使用明确指定版本的 Python 3.7 兼容依赖包。

---

## 第一步：在有网络的机器上下载

### 1.1 确保 requirements.txt 正确

确认 `api/requirements.txt` 内容如下：

```
Flask==2.0.3
flask-cors==3.0.10
pymysql==1.0.2
python-dotenv==0.19.2
Werkzeug==2.0.3
itsdangerous==2.0.1
click==8.0.4
Jinja2==3.0.3
MarkupSafe==2.0.1
```

### 1.2 运行下载脚本

```bash
# 给脚本执行权限
chmod +x download-py37-packages.sh

# 运行下载脚本
./download-py37-packages.sh
```

脚本会：
1. 清理旧的 `offline-packages` 目录
2. 下载所有 Python 3.7 兼容的依赖包
3. 验证关键包是否下载成功
4. 检查版本兼容性
5. 创建 `python-packages-py37.tar.gz` 压缩包

### 1.3 验证下载结果

```bash
# 查看下载的包
ls offline-packages/

# 应该看到以下文件（版本号可能略有不同）：
# Flask-2.0.3-py3-none-any.whl
# Flask_Cors-3.0.10-py2.py3-none-any.whl
# PyMySQL-1.0.2-py3-none-any.whl
# python_dotenv-0.19.2-py2.py3-none-any.whl
# Werkzeug-2.0.3-py3-none-any.whl
# itsdangerous-2.0.1-py3-none-any.whl
# click-8.0.4-py3-none-any.whl
# Jinja2-3.0.3-py3-none-any.whl
# MarkupSafe-2.0.1-cp37-cp37m-*.whl

# 检查压缩包
ls -lh python-packages-py37.tar.gz
```

**重要检查点：**
- ✅ `itsdangerous-2.0.1` (不是 2.2.0)
- ✅ `click-8.0.4` (不是 8.3+)

如果看到错误版本，需要手动删除并重新下载：

```bash
# 删除错误版本
rm offline-packages/itsdangerous-2.2.0*
rm offline-packages/click-8.3.*

# 手动下载正确版本
pip3 download --no-cache-dir itsdangerous==2.0.1 -d offline-packages/
pip3 download --no-cache-dir click==8.0.4 -d offline-packages/

# 重新打包
tar -czf python-packages-py37.tar.gz offline-packages/
```

---

## 第二步：传输到目标服务器

### 方法 1：使用 scp

```bash
scp python-packages-py37.tar.gz user@server:/path/to/dateQuality/
```

### 方法 2：使用 U盘

1. 将 `python-packages-py37.tar.gz` 复制到 U盘
2. 在目标服务器上挂载 U盘
3. 复制文件到项目目录

### 方法 3：使用共享文件夹

如果使用虚拟机，可以通过共享文件夹传输。

---

## 第三步：在目标服务器上安装

### 3.1 解压离线包

```bash
cd /path/to/dateQuality

# 解压
tar -xzf python-packages-py37.tar.gz

# 验证解压结果
ls offline-packages/ | wc -l
# 应该看到 9 个左右的 .whl 文件
```

### 3.2 运行安装脚本

```bash
# 给脚本执行权限（如果还没有）
chmod +x install-offline.sh

# 运行安装
./install-offline.sh
```

安装脚本会：
1. 检测 Python 版本
2. 删除旧的虚拟环境（如果存在）
3. 创建新的虚拟环境
4. 从离线包安装所有依赖

### 3.3 验证安装

```bash
# 激活虚拟环境
source api/venv/bin/activate

# 检查 Python 版本
python --version
# 应该显示: Python 3.7.x

# 检查 Flask 版本
python -c "import flask; print(flask.__version__)"
# 应该显示: 2.0.3

# 检查所有模块
python -c "import flask, pymysql, flask_cors, dotenv; print('✓ 所有模块导入成功')"

# 退出虚拟环境
deactivate
```

---

## 第四步：启动服务

### 4.1 配置数据库

```bash
# 复制配置文件
cp api/.env.example api/.env

# 编辑配置
vi api/.env
```

配置内容：
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=data_center
```

### 4.2 初始化数据库

```bash
# 创建数据库和表
mysql -u root -p < setup-database.sql

# 导入数据
python3 import-csv-to-mysql.py
```

### 4.3 启动服务

```bash
# 启动所有服务
./start-all.sh

# 或分别启动
./start-backend.sh   # 后端 API (端口 5000)
./start-frontend.sh  # 前端服务 (端口 8000)
```

### 4.4 验证服务

```bash
# 测试 API
curl http://localhost:5000/api/summary

# 访问前端
# 浏览器打开: http://localhost:8000
```

---

## 常见问题

### Q1: 下载时仍然获取到错误版本

**原因**: pip 缓存或自动依赖解析

**解决**:
```bash
# 清除 pip 缓存
pip3 cache purge

# 使用 --no-cache-dir 强制重新下载
pip3 download --no-cache-dir -r api/requirements.txt -d offline-packages/
```

### Q2: 安装时提示权限错误

**解决**:
```bash
# 检查文件权限
ls -l python-packages-py37.tar.gz

# 修改权限
chmod 644 python-packages-py37.tar.gz
```

### Q3: 虚拟环境创建失败

**原因**: 缺少 python3-venv

**解决**:
```bash
# Debian/Ubuntu
sudo apt install python3-venv

# CentOS/RHEL
sudo yum install python3-devel

# 或针对特定版本
sudo apt install python3.7-venv
```

### Q4: 启动时仍然提示 "No module named 'flask'"

**原因**: 虚拟环境未正确激活或依赖未安装

**解决**:
```bash
# 删除虚拟环境
rm -rf api/venv

# 重新安装
./install-offline.sh

# 手动验证
source api/venv/bin/activate
python -c "import flask"
deactivate
```

### Q5: MarkupSafe 安装失败（需要编译）

**原因**: MarkupSafe 2.0.1 可能需要编译

**解决方案 1**: 在下载机器上下载预编译的 wheel
```bash
# 下载适合目标平台的 wheel
pip3 download --platform manylinux2014_x86_64 --only-binary=:all: MarkupSafe==2.0.1 -d offline-packages/
```

**解决方案 2**: 在目标服务器上安装编译工具
```bash
sudo yum install gcc python3-devel
```

---

## Python 3.7 兼容版本对照表

| 包 | Python 3.7 版本 | Python 3.8+ 版本 | 说明 |
|---|---|---|---|
| Flask | 2.0.3 | 3.0+ | 2.0.x 完全支持 3.7 |
| flask-cors | 3.0.10 | 4.0+ | 3.0.x 支持 3.7 |
| pymysql | 1.0.2 | 1.1+ | 1.0.x 支持 3.7 |
| python-dotenv | 0.19.2 | 1.0+ | 0.19.x 支持 3.7 |
| Werkzeug | 2.0.3 | 3.0+ | 2.0.x 支持 3.7 |
| itsdangerous | 2.0.1 | 2.2+ | ⚠️ 2.2+ 需要 3.8+ |
| click | 8.0.4 | 8.3+ | ⚠️ 8.3+ 需要 3.10+ |
| Jinja2 | 3.0.3 | 3.1+ | 3.0.x 支持 3.7 |
| MarkupSafe | 2.0.1 | 2.1+ | 2.0.x 支持 3.7 |
| importlib-metadata | 4.8.3 | (内置) | ⚠️ Python 3.7 必需 |
| zipp | 3.6.0 | - | importlib-metadata 依赖 |
| typing-extensions | 4.1.1 | - | Python 3.7 兼容性 |

---

## 完整命令速查

### 在下载机器上
```bash
chmod +x download-py37-packages.sh
./download-py37-packages.sh
scp python-packages-py37.tar.gz user@server:/path/
```

### 在目标服务器上
```bash
tar -xzf python-packages-py37.tar.gz
./install-offline.sh
cp api/.env.example api/.env
vi api/.env
mysql -u root -p < setup-database.sql
python3 import-csv-to-mysql.py
./start-all.sh
```

---

## 长期建议

虽然 Python 3.7 可以工作，但它已经停止维护（EOL: 2023-06-27）。

**建议**：
1. **短期**：使用本指南的 Python 3.7 兼容版本
2. **长期**：计划升级到 Python 3.8+ 以获得：
   - 安全更新
   - 更好的性能
   - 最新的库支持

---

**问题已解决！** 🎉

使用本指南可以在 Python 3.7 环境下成功部署系统。
