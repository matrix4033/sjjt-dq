# 大数据中心数据汇聚情况周报系统 - MySQL 版本

## 项目说明

本项目已升级为使用 MySQL 数据库存储数据，通过 Python Flask API 提供数据接口。

## 系统架构

```
前端 (HTML/JS) <---> Python Flask API <---> MySQL 数据库
```

## 安装步骤

### 1. 数据库准备

在 MySQL 中创建数据库和表：

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS data_center DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE data_center;

-- 创建汇总表
CREATE TABLE IF NOT EXISTS 汇总 (
    id INT AUTO_INCREMENT PRIMARY KEY,
    部门名称 VARCHAR(100),
    部门表数量 INT,
    前置机名称 VARCHAR(100),
    前置机表数量 INT,
    前置仓名称 VARCHAR(100),
    前置仓表数量 INT,
    贴源层名称 VARCHAR(100),
    贴源层表数量 INT,
    创建时间 TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    更新时间 TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建明细表
CREATE TABLE IF NOT EXISTS 明细 (
    id INT AUTO_INCREMENT PRIMARY KEY,
    部门 VARCHAR(100),
    表中文名 VARCHAR(200),
    表英文名 VARCHAR(200),
    部门到前置机状态 VARCHAR(50),
    `异常原因说明` VARCHAR(500),
    前置机到前置仓状态 VARCHAR(50),
    `异常原因说明1` VARCHAR(500),
    前置仓到贴源层状态 VARCHAR(50),
    `异常原因说明2` VARCHAR(500),
    创建时间 TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    更新时间 TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_department (部门),
    INDEX idx_table_name (表中文名)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. 导入现有 CSV 数据到 MySQL（可选）

如果需要将现有的 CSV 数据导入到 MySQL：

```sql
-- 导入汇总数据
LOAD DATA LOCAL INFILE 'data/汇总.csv'
INTO TABLE 汇总
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(部门名称, 部门表数量, 前置机名称, 前置机表数量, 前置仓名称, 前置仓表数量, 贴源层名称, 贴源层表数量);

-- 导入明细数据
LOAD DATA LOCAL INFILE 'data/明细.csv'
INTO TABLE 明细
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(部门, 表中文名, 表英文名, 部门到前置机状态, `异常原因说明`, 前置机到前置仓状态, `异常原因说明1`, 前置仓到贴源层状态, `异常原因说明2`);
```

### 3. 安装 Python 依赖

```bash
cd api
pip install -r requirements.txt
```

### 4. 配置数据库连接

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cd api
copy .env.example .env
```

编辑 `.env` 文件：

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=data_center
```

### 5. 启动 Python API 服务

```bash
cd api
python app.py
```

服务将在 `http://localhost:5000` 启动。

### 6. 修改前端配置

在 `index.html` 中，将原来的 `data-loader.js` 替换为 `data-loader-mysql.js`：

```html
<!-- 原来的 -->
<script src="js/data-loader.js"></script>

<!-- 改为 -->
<script src="js/data-loader-mysql.js"></script>
```

### 7. 启动前端服务

使用任意 HTTP 服务器启动前端，例如：

```bash
# 使用 Python 内置服务器
python -m http.server 8000

# 或使用 Node.js http-server
npx http-server -p 8000
```

访问 `http://localhost:8000` 即可查看页面。

## API 接口说明

### 1. 获取汇总数据
```
GET /api/summary
```

响应示例：
```json
{
  "success": true,
  "data": [...],
  "count": 45
}
```

### 2. 获取明细数据
```
GET /api/detail
```

响应示例：
```json
{
  "success": true,
  "data": [...],
  "count": 1279
}
```

### 3. 健康检查
```
GET /api/health
```

响应示例：
```json
{
  "success": true,
  "message": "API 服务运行正常，数据库连接成功"
}
```

## 故障排查

### 问题 1: API 连接失败
- 确保 Python API 服务正在运行
- 检查端口 5000 是否被占用
- 查看浏览器控制台的错误信息

### 问题 2: 数据库连接失败
- 确认 MySQL 服务正在运行
- 检查 `.env` 配置是否正确
- 确认数据库用户有足够的权限

### 问题 3: 跨域问题
- API 已配置 CORS，应该不会有跨域问题
- 如果仍有问题，检查浏览器控制台的 CORS 错误信息

## 优势

相比 CSV 文件方式，使用 MySQL 的优势：

1. **数据实时性**: 数据更新后立即生效，无需重新部署文件
2. **数据安全**: 数据库提供更好的访问控制和安全性
3. **性能优化**: 支持索引、查询优化等
4. **数据管理**: 便于数据的增删改查操作
5. **扩展性**: 易于添加新的数据字段和功能

## 注意事项

1. 确保 MySQL 字符集为 `utf8mb4`，以支持中文和特殊字符
2. 定期备份数据库
3. 生产环境建议使用 Gunicorn 或 uWSGI 部署 Flask 应用
4. 建议配置数据库连接池以提高性能
