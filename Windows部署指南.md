# Windows 部署指南 - PostgreSQL 版本

## 前提条件

1. **Python 3.7+**
   - 下载: https://www.python.org/downloads/
   - 安装时勾选 "Add Python to PATH"

2. **PostgreSQL 12+**
   - 下载: https://www.postgresql.org/download/windows/
   - 或使用 EnterpriseDB 安装器

3. **Git** (可选)
   - 下载: https://git-scm.com/download/win

---

## 第一步：安装 PostgreSQL

### 1.1 下载安装器

访问: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

选择适合你的 Windows 版本的安装器。

### 1.2 运行安装器

1. 双击安装器
2. 选择安装目录（默认: `C:\Program Files\PostgreSQL\14`）
3. 选择组件（全部勾选）
4. 设置数据目录（默认: `C:\Program Files\PostgreSQL\14\data`）
5. **设置 postgres 用户密码**（记住这个密码！）
6. 设置端口（默认: 5432）
7. 选择区域设置（默认: Chinese, China）
8. 完成安装

### 1.3 验证安装

打开命令提示符（CMD）:

```cmd
# 检查 PostgreSQL 版本
psql --version

# 如果提示找不到命令，添加到 PATH:
# 控制面板 > 系统 > 高级系统设置 > 环境变量
# 在 Path 中添加: C:\Program Files\PostgreSQL\14\bin
```

---

## 第二步：创建数据库

### 2.1 使用 pgAdmin

1. 打开 pgAdmin 4（随 PostgreSQL 安装）
2. 连接到 PostgreSQL 服务器
3. 右键 "Databases" > "Create" > "Database"
4. 数据库名: `data_center`
5. 点击 "Save"

### 2.2 使用命令行

```cmd
# 切换到 PostgreSQL bin 目录
cd "C:\Program Files\PostgreSQL\14\bin"

# 创建数据库
createdb -U postgres data_center

# 或使用 psql
psql -U postgres
CREATE DATABASE data_center;
\q
```

---

## 第三步：安装 Python 依赖

### 3.1 自动安装（推荐）

```cmd
# 进入项目目录
cd D:\file\scdsj\html\数据质量控制台账

# 运行安装脚本
install-windows.bat
```

脚本会自动:
1. 创建虚拟环境
2. 安装所有依赖
3. 验证安装
4. 创建配置文件

### 3.2 手动安装

```cmd
# 删除旧的虚拟环境（如果存在）
rmdir /s /q api\venv

# 创建虚拟环境
python -m venv api\venv

# 激活虚拟环境
call api\venv\Scripts\activate.bat

# 升级 pip
python -m pip install --upgrade pip

# 安装依赖
pip install -r api\requirements.txt

# 验证
python -c "import psycopg2; print('psycopg2 已安装')"

# 退出虚拟环境
deactivate
```

---

## 第四步：配置数据库连接

### 4.1 复制配置文件

```cmd
copy api\.env.example api\.env
```

### 4.2 编辑配置

用记事本或其他编辑器打开 `api\.env`:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=你的密码
DB_NAME=data_center
```

**重要**: 将 `你的密码` 替换为安装 PostgreSQL 时设置的密码。

---

## 第五步：初始化数据库

### 5.1 创建表结构

```cmd
# 方法 1: 使用 psql 命令
psql -U postgres -d data_center -f setup-database-postgresql.sql

# 方法 2: 使用 pgAdmin
# 1. 打开 pgAdmin
# 2. 连接到 data_center 数据库
# 3. 点击 "Query Tool"
# 4. 打开 setup-database-postgresql.sql 文件
# 5. 点击 "Execute" (F5)
```

### 5.2 导入数据

```cmd
# 确保 CSV 文件存在
dir data\汇总.csv
dir data\明细.csv

# 运行导入脚本
python import-csv-to-postgresql.py
```

---

## 第六步：启动服务

### 6.1 启动后端 API

```cmd
start-backend.bat
```

### 6.2 启动前端服务

打开新的命令提示符窗口:

```cmd
start-frontend.bat
```

### 6.3 同时启动（推荐）

```cmd
start-all.bat
```

---

## 第七步：验证部署

### 7.1 测试 API

打开浏览器或使用 curl:

```cmd
# 健康检查
curl http://localhost:5000/api/health

# 获取汇总数据
curl http://localhost:5000/api/summary

# 获取明细数据
curl http://localhost:5000/api/detail
```

### 7.2 访问前端

浏览器打开: http://localhost:8000

---

## 常见问题

### Q1: Python 命令找不到

**错误**: `'python' 不是内部或外部命令`

**解决**:

1. 重新安装 Python，勾选 "Add Python to PATH"
2. 或手动添加到 PATH:
   - 控制面板 > 系统 > 高级系统设置 > 环境变量
   - 在 Path 中添加: `C:\Users\你的用户名\AppData\Local\Programs\Python\Python39`

### Q2: psycopg2 安装失败

**错误**: `error: Microsoft Visual C++ 14.0 is required`

**解决**:

使用 `psycopg2-binary` 代替（已在 requirements.txt 中）:

```cmd
pip install psycopg2-binary==2.8.6
```

### Q3: 无法连接数据库

**错误**: `could not connect to server`

**解决**:

1. 检查 PostgreSQL 服务是否运行:
   - 打开 "服务" (services.msc)
   - 找到 "postgresql-x64-14"
   - 确保状态为 "正在运行"

2. 检查配置文件 `api\.env`:
   - 确认密码正确
   - 确认端口为 5432

3. 测试连接:
   ```cmd
   psql -U postgres -d data_center
   ```

### Q4: 端口被占用

**错误**: `Address already in use`

**解决**:

```cmd
# 查看占用端口的进程
netstat -ano | findstr :5000

# 结束进程（替换 PID）
taskkill /PID 进程ID /F
```

### Q5: 中文乱码

**解决**:

在命令提示符中运行:

```cmd
chcp 65001
```

或在脚本开头添加:

```bat
@echo off
chcp 65001 >nul
```

---

## 开发环境配置

### 使用 VS Code

1. 安装 Python 扩展
2. 选择虚拟环境:
   - Ctrl+Shift+P
   - "Python: Select Interpreter"
   - 选择 `.\api\venv\Scripts\python.exe`

### 使用 PyCharm

1. File > Settings > Project > Python Interpreter
2. 点击齿轮 > Add
3. 选择 "Existing environment"
4. 选择 `.\api\venv\Scripts\python.exe`

---

## 生产环境部署

### 使用 waitress (Windows WSGI 服务器)

```cmd
# 安装 waitress
pip install waitress

# 启动
waitress-serve --host=0.0.0.0 --port=5000 api.app:app
```

### 使用 Windows 服务

使用 NSSM (Non-Sucking Service Manager):

1. 下载 NSSM: https://nssm.cc/download
2. 安装服务:
   ```cmd
   nssm install DataCenterAPI "D:\path\to\api\venv\Scripts\python.exe" "D:\path\to\api\app.py"
   nssm start DataCenterAPI
   ```

---

## 备份和恢复

### 备份数据库

```cmd
# 使用 pg_dump
"C:\Program Files\PostgreSQL\14\bin\pg_dump" -U postgres -d data_center > backup.sql

# 或使用 pgAdmin
# 右键数据库 > Backup
```

### 恢复数据库

```cmd
# 使用 psql
"C:\Program Files\PostgreSQL\14\bin\psql" -U postgres -d data_center < backup.sql

# 或使用 pgAdmin
# 右键数据库 > Restore
```

---

## 快速命令参考

```cmd
# 创建虚拟环境
python -m venv api\venv

# 激活虚拟环境
call api\venv\Scripts\activate.bat

# 安装依赖
pip install -r api\requirements.txt

# 退出虚拟环境
deactivate

# 启动服务
start-all.bat

# 停止服务
# 按 Ctrl+C 或关闭命令提示符窗口
```

---

## 目录结构

```
D:\file\scdsj\html\数据质量控制台账\
├── api\
│   ├── venv\              # Python 虚拟环境
│   ├── app.py             # Flask 应用
│   ├── .env               # 数据库配置
│   └── requirements.txt   # Python 依赖
├── data\
│   ├── 汇总.csv
│   └── 明细.csv
├── js\
├── css\
├── index.html
├── setup-database-postgresql.sql
├── import-csv-to-postgresql.py
├── install-windows.bat    # Windows 安装脚本
├── start-backend.bat      # 启动后端
├── start-frontend.bat     # 启动前端
└── start-all.bat          # 启动所有服务
```

---

**部署完成！** 🎉

你的系统现在可以在 Windows 上运行了。
