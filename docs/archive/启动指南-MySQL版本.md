# 数据汇聚治理链路对账监控系统 - 启动指南（MySQL版本）

## 系统架构

```
前端 (HTML/JS) <---> Python Flask API <---> MySQL 数据库
     端口 8000              端口 5000
```

## 一、前置准备

### 1. 确保已安装以下软件：
- MySQL 8.0+ （确保服务正在运行）
- Python 3.7+
- 现代浏览器（Chrome、Edge、Firefox等）

### 2. 检查MySQL服务状态
打开命令行，输入：
```bash
mysql -u root -p
```
如果能成功登录，说明MySQL服务正常。

---

## 二、数据库初始化（首次运行必须执行）

### 步骤1：配置数据库连接

编辑 `api/.env` 文件，修改数据库密码：

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的MySQL密码
DB_NAME=data_center
```

### 步骤2：创建数据库和表

在项目根目录执行：

```bash
mysql -u root -p < setup-database.sql
```

输入MySQL密码后，会自动创建：
- 数据库：`data_center`
- 表：`汇总` 和 `明细`

### 步骤3：导入CSV数据

```bash
python import-csv-to-mysql.py
```

成功后会显示：
- ✓ 汇总数据导入完成！共导入 45 条记录
- ✓ 明细数据导入完成！共导入 1279 条记录

---

## 三、启动系统

### 方法1：一键启动（推荐）

双击运行：
```
start-all.bat
```

这会自动启动：
1. 后端API服务（端口 5000）
2. 前端服务器（端口 8000）

### 方法2：分别启动

#### 启动后端：
```bash
start-backend.bat
```
或手动执行：
```bash
cd api
python app.py
```

#### 启动前端：
在新的命令行窗口执行：
```bash
start-frontend.bat
```
或手动执行：
```bash
python -m http.server 8000
```

---

## 四、访问系统

打开浏览器，访问：

```
http://localhost:8000
```

### 系统功能：
1. **整体汇聚情况** - 4个指标卡片展示统计数据
2. **桑基图** - 可视化数据流转链路
3. **明细数据** - 点击节点查看详细信息

---

## 五、API接口测试

### 1. 健康检查
```
http://localhost:5000/api/health
```

### 2. 获取汇总数据
```
http://localhost:5000/api/summary
```

### 3. 获取明细数据
```
http://localhost:5000/api/detail
```

---

## 六、常见问题

### 问题1：数据库连接失败
**错误信息**：`Access denied for user 'root'@'localhost'`

**解决方法**：
1. 检查 `api/.env` 文件中的密码是否正确
2. 确认MySQL服务正在运行
3. 确认用户名和密码正确

### 问题2：端口被占用
**错误信息**：`Address already in use`

**解决方法**：
- 修改端口号，或关闭占用端口的程序
- 后端端口在 `api/app.py` 最后一行修改
- 前端端口在启动命令中修改：`python -m http.server 8001`

### 问题3：页面显示空白
**可能原因**：
1. 后端API未启动
2. 数据库中没有数据
3. 浏览器控制台有错误

**解决方法**：
1. 确认后端服务正在运行（访问 http://localhost:5000/api/health）
2. 确认数据已导入（执行 `python import-csv-to-mysql.py`）
3. 按F12打开浏览器控制台查看错误信息

### 问题4：数据导入失败
**错误信息**：`Data too long for column`

**解决方法**：
```bash
mysql -u root -p < update-table-structure.sql
python import-csv-to-mysql.py
```

---

## 七、停止服务

### 停止后端：
在后端命令行窗口按 `Ctrl + C`

### 停止前端：
在前端命令行窗口按 `Ctrl + C`

或直接关闭对应的命令行窗口。

---

## 八、数据更新

如果需要更新CSV数据：

1. 将新的CSV文件放到 `data/` 目录
2. 重新执行导入脚本：
```bash
python import-csv-to-mysql.py
```

注意：脚本会清空现有数据后重新导入。

---

## 九、项目文件说明

```
项目根目录/
├── api/                      # 后端API目录
│   ├── app.py               # Flask应用主文件
│   ├── .env                 # 数据库配置（需手动配置）
│   ├── .env.example         # 配置示例
│   └── requirements.txt     # Python依赖包
├── data/                     # CSV数据文件
│   ├── 汇总.csv
│   └── 明细.csv
├── js/                       # 前端JavaScript
│   ├── data-loader-mysql.js # MySQL数据加载器
│   └── ...
├── css/                      # 样式文件
├── index.html               # 主页面（已配置使用MySQL）
├── setup-database.sql       # 数据库初始化脚本
├── update-table-structure.sql # 表结构更新脚本
├── import-csv-to-mysql.py   # 数据导入脚本
├── start-all.bat            # 一键启动脚本
├── start-backend.bat        # 后端启动脚本
└── start-frontend.bat       # 前端启动脚本
```

---

## 十、技术支持

如遇到其他问题，请检查：
1. MySQL服务是否正常运行
2. Python依赖是否完整安装
3. 浏览器控制台的错误信息
4. 后端命令行窗口的错误日志

---

**祝使用愉快！** 🎉
