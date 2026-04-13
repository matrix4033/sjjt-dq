# Docker 部署指南

## 前置准备

### Windows 用户配置镜像加速器（推荐）

为了提高镜像下载速度，建议先配置 Docker 镜像加速器：

**方法一：使用批处理脚本（推荐）**
```cmd
# 运行配置脚本
setup-docker-mirror.bat
```

**方法二：手动配置**
1. 打开 Docker Desktop
2. 点击设置图标 → Settings → Docker Engine
3. 在 JSON 配置中添加：
```json
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://dockerproxy.com",
    "https://mirror.baidubce.com"
  ]
}
```
4. 点击 "Apply & Restart"

## 快速开始

### 1. 使用 Docker Compose（推荐）

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f app
```

访问地址：
- 前端页面：http://localhost
- API 服务：http://localhost:5000
- 健康检查：http://localhost:5000/api/health

### 2. 单独构建和运行

```bash
# 构建镜像
docker build -t data-center-app .

# 运行容器（需要先启动 PostgreSQL）
docker run -d \
  --name data-center-app \
  -p 5000:5000 \
  -e DB_HOST=your_db_host \
  -e DB_PORT=5432 \
  -e DB_USER=postgres \
  -e DB_PASSWORD=your_password \
  -e DB_NAME=data_center \
  data-center-app
```

## 环境变量配置

在 `api/.env` 文件中配置数据库连接：

```env
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres123
DB_NAME=data_center
```

## 数据库初始化

Docker Compose 会自动执行以下 SQL 文件：
- `setup-database-postgresql.sql` - 创建表结构
- `update-table-structure.sql` - 更新表结构

## 服务管理

```bash
# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看容器日志
docker-compose logs -f [service_name]

# 进入容器
docker-compose exec app bash
```

## 生产环境部署

1. 修改 `docker-compose.yml` 中的数据库密码
2. 配置 Nginx SSL 证书
3. 设置数据卷备份策略
4. 配置监控和日志收集

## 故障排除

### 数据库连接失败
```bash
# 检查数据库是否启动
docker-compose ps postgres

# 查看数据库日志
docker-compose logs postgres
```

### 应用启动失败
```bash
# 查看应用日志
docker-compose logs app

# 检查环境变量
docker-compose exec app env | grep DB_
```