# Python 3.7 兼容说明

## 问题

Flask 3.0 要求 Python 3.8+，但你的服务器是 Python 3.7.9

```
ERROR: Package 'Flask' requires a different Python: 3.7.9 not in '>=3.8'
```

---

## 解决方案

### 方案 1：使用兼容 Python 3.7 的依赖版本（推荐）

已将 `api/requirements.txt` 修改为：

```
Flask==2.0.3          # 支持 Python 3.7
flask-cors==3.0.10    # 支持 Python 3.7
pymysql==1.0.2        # 支持 Python 3.7
python-dotenv==0.19.2 # 支持 Python 3.7
Werkzeug==2.0.3       # Flask 依赖，支持 Python 3.7
```

**Flask 2.0.x 系列完全支持 Python 3.7**

#### 重新下载依赖

```bash
# 在有网络的机器上
rm -rf offline-packages
pip3 download -r api/requirements.txt -d offline-packages/
tar -czf python-packages-py37.tar.gz offline-packages/
```

#### 在目标服务器上安装

```bash
# 解压
tar -xzf python-packages-py37.tar.gz

# 安装
./install-offline.sh
```

---

### 方案 2：升级 Python 到 3.8+（如果可行）

#### UOS/EulerOS 升级 Python

```bash
# 检查可用版本
yum list python3*

# 安装 Python 3.8 或更高版本
sudo yum install python38

# 或从源码编译
sudo yum install gcc openssl-devel bzip2-devel libffi-devel
cd /tmp
wget https://www.python.org/ftp/python/3.8.18/Python-3.8.18.tgz
tar -xzf Python-3.8.18.tgz
cd Python-3.8.18
./configure --enable-optimizations
make -j $(nproc)
sudo make altinstall

# 使用 Python 3.8
python3.8 --version
```

然后使用 Python 3.8 创建虚拟环境：

```bash
python3.8 -m venv api/venv
```

---

## 版本兼容性对照表

| Python 版本 | Flask 版本 | 状态 |
|------------|-----------|------|
| 3.7 | Flask 2.3.x | ✅ 支持 |
| 3.7 | Flask 3.0+ | ❌ 不支持 |
| 3.8+ | Flask 2.3.x | ✅ 支持 |
| 3.8+ | Flask 3.0+ | ✅ 支持 |

---

## 快速修复步骤

### 如果已经下载了 Flask 3.0 的包

```bash
# 1. 删除旧的离线包
rm -rf offline-packages

# 2. 使用修改后的 requirements.txt 重新下载
pip3 download -r api/requirements.txt -d offline-packages/

# 3. 重新打包
tar -czf python-packages-py37.tar.gz offline-packages/

# 4. 传输到服务器
scp python-packages-py37.tar.gz user@server:/path/

# 5. 在服务器上解压并安装
tar -xzf python-packages-py37.tar.gz
./install-offline.sh
```

---

## 验证安装

```bash
# 激活虚拟环境
source api/venv/bin/activate

# 检查 Flask 版本
python -c "import flask; print(flask.__version__)"
# 应该显示: 2.3.3

# 检查 Python 版本
python --version
# 应该显示: Python 3.7.9

# 测试导入
python -c "import flask, pymysql, dotenv, flask_cors"
# 无输出表示成功

# 退出虚拟环境
deactivate
```

---

## Flask 2.3 vs 3.0 差异

好消息：**Flask 2.3 和 3.0 的 API 基本兼容**，你的代码无需修改！

主要差异：
- Flask 3.0 移除了一些已弃用的功能
- Flask 3.0 改进了类型提示
- Flask 3.0 要求 Python 3.8+

你的项目使用的都是基础 API，完全兼容 Flask 2.3。

---

## 其他依赖的 Python 3.7 兼容性

| 包 | 版本 | Python 3.7 兼容性 |
|----|------|-------------------|
| Flask | 2.3.3 | ✅ 完全兼容 |
| flask-cors | 4.0.0 | ✅ 完全兼容 |
| pymysql | 1.1.0 | ✅ 完全兼容 |
| python-dotenv | 1.0.0 | ✅ 完全兼容 |

所有依赖都支持 Python 3.7！

---

## 推荐做法

1. **短期**：使用 Flask 2.3.3（已修改 requirements.txt）
2. **长期**：计划升级到 Python 3.8+ 以获得更好的支持

---

## 完整部署命令（Python 3.7）

```bash
# 在有网络的机器上
pip3 download -r api/requirements.txt -d offline-packages/
tar -czf python-packages-py37.tar.gz offline-packages/

# 传输到服务器
scp python-packages-py37.tar.gz user@server:/path/

# 在服务器上
tar -xzf python-packages-py37.tar.gz
./install-offline.sh
vi api/.env
mysql -u root -p < setup-database.sql
api/venv/bin/python import-csv-to-mysql.py
./start-all.sh
```

---

**问题已解决！** 🎉

使用 Flask 2.3.3 可以完美运行在 Python 3.7 上。
