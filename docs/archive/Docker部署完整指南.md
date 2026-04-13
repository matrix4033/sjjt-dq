# Docker 部署完整指南

## 📦 部署准备

### 1. 文件清单

需要上传到服务器的文件：
- `dzxt-arm64.tar` - Docker 镜像文件
- `.env` - 环境配置文件（需要根据服务器环境修改）
- `docker-run.sh` - Docker 启动脚本

### 2. 服务器要求

- Docker 已安装（版本 20.10+）
- 端口可用：5000（后端API）、8000（前端，可选）
- 磁盘空间：至少 2GB

---

## 🚀 快速部署步骤

### 步骤 1：上传文件到服务器

```bash
# 在本地执行，上传文件到服务器
scp dzxt-arm64.tar user@172.23.51.19:/home/user/
scp api/.env user@172.23.51.19:/home/user/
scp docker-run.sh user@172.23.51.19:/home/user/
```

### 步骤 2：登录服务器并加载镜像

```bash
# SSH 登录服务器
ssh user@172.23.51.19

# 加载 Docker 镜像
docker load -i dzxt-arm64.tar

# 查看已加载的镜像
docker images | grep dzxt
```

### 步骤 3：配置环境变量

编辑 `.env` 文件，修改数据库连接信息：

```bash
nano .env
```

内容示例：
```properties
# 数据库配置（根据实际环境修改）
DB_HOST=172.23.51.150
DB_PORT=5432
DB_USER=pg
DB_PASSWORD=YourSecurePassword
DB_NAME=postgres

# 应用配置
PORT=5000
SECRET_KEY=your-secret-key-here
```

### 步骤 4：启动容器

```bash
# 给启动脚本添加执行权限
chmod +x docker-run.sh

# 启动容器
./docker-run.sh
```

或者手动启动：

```bash
docker run -d \
  --name dzxt-app \
  --restart unless-stopped \
  -p 5000:5000 \
  --env-file .env \
  dzxt:offline-build
```

### 步骤 5：验证部署

```bash
# 检查容器状态
docker ps | grep dzxt

# 查看容器日志
docker logs dzxt-app

# 测试健康检查
curl http://localhost:5000/api/health

# 测试登录页面
curl http://localhost:5000/login.html
```

---

## 🌐 访问应用

部署成功后，可以通过以下地址访问：

- **主页面**：http://172.23.51.19:5000
- **登录页面**：http://172.23.51.19:5000/login.html
- **API健康检查**：http://172.23.51.19:5000/api/health

**登录凭据：**
- 用户名：`admin`
- 密码：`Scdsj2026`

---

## 🔧 容器管理命令

### 查看容器状态
```bash
docker ps -a | grep dzxt
```

### 查看实时日志
```bash
docker logs -f dzxt-app
```

### 停止容器
```bash
docker stop dzxt-app
```

### 启动容器
```bash
docker start dzxt-app
```

### 重启容器
```bash
docker restart dzxt-app
```

### 删除容器
```bash
docker stop dzxt-app
docker rm dzxt-app
```

### 进入容器调试
```bash
docker exec -it dzxt-app /bin/bash
```

---

## 🔍 故障排查

### 问题 1：容器启动失败

```bash
# 查看详细日志
docker logs dzxt-app

# 检查环境变量
docker exec dzxt-app env | grep DB_
```

### 问题 2：无法连接数据库

```bash
# 测试数据库连接
docker exec dzxt-app curl -v telnet://172.23.51.150:5432

# 检查网络
docker exec dzxt-app ping 172.23.51.150
```

### 问题 3：端口被占用

```bash
# 查看端口占用
netstat -tulpn | grep 5000

# 使用其他端口启动
docker run -d --name dzxt-app -p 8010:5000 --env-file .env dzxt:offline-build
```

### 问题 4：权限问题

```bash
# 检查文件权限
ls -la .env

# 修改权限
chmod 600 .env
```

---

## 🔄 更新部署

### 更新镜像

```bash
# 停止并删除旧容器
docker stop dzxt-app
docker rm dzxt-app

# 删除旧镜像
docker rmi dzxt:offline-build

# 加载新镜像
docker load -i dzxt-arm64-new.tar

# 启动新容器
./docker-run.sh
```

### 更新配置

```bash
# 修改 .env 文件
nano .env

# 重启容器使配置生效
docker restart dzxt-app
```

---

## 🛡️ 安全建议

1. **修改默认密码**
   - 修改 `api/app.py` 中的 `ADMIN_PASSWORD`
   - 修改数据库密码

2. **使用 HTTPS**
   - 配置 Nginx 反向代理
   - 申请 SSL 证书

3. **限制访问**
   - 配置防火墙规则
   - 使用 VPN 或内网访问

4. **定期备份**
   - 备份 `.env` 文件
   - 备份数据库数据

---

## 📊 性能优化

### 使用 Docker Compose（推荐）

如果需要同时管理多个容器（应用 + 数据库），使用 Docker Compose：

```bash
# 启动所有服务
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止所有服务
docker-compose down
```

### 资源限制

```bash
docker run -d \
  --name dzxt-app \
  --restart unless-stopped \
  -p 5000:5000 \
  --env-file .env \
  --memory="512m" \
  --cpus="1.0" \
  dzxt:offline-build
```

---

## 📝 常见问题

**Q: 如何查看应用版本？**
```bash
docker exec dzxt-app python -c "import flask; print(flask.__version__)"
```

**Q: 如何备份容器？**
```bash
docker commit dzxt-app dzxt:backup-$(date +%Y%m%d)
docker save -o dzxt-backup.tar dzxt:backup-$(date +%Y%m%d)
```

**Q: 如何清理 Docker 资源？**
```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的容器
docker container prune

# 清理所有未使用的资源
docker system prune -a
```

---

## 📞 技术支持

如遇到问题，请提供以下信息：
1. 容器日志：`docker logs dzxt-app`
2. 容器状态：`docker ps -a | grep dzxt`
3. 系统信息：`uname -a`
4. Docker 版本：`docker --version`
