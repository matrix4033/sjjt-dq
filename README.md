# 数据汇聚治理链路对账监控系统

基于 Flask + PostgreSQL + D3.js 的数据可视化系统，用于展示数据从"部门 → 前置机 → 前置仓 → 贴源层"的汇聚链路对账情况。

---

## 特性

- **数据可视化** - 使用 D3.js 桑基图展示数据汇聚链路
- **实时更新** - 支持数据的实时查询和展示
- **PostgreSQL** - 使用 PostgreSQL 数据库
- **Docker 支持** - 提供 Docker 一键部署

---

## 项目结构

```
sjjt-dq/
├── src/                    # 源代码
│   ├── api/               # Flask 后端
│   │   ├── app.py        # Flask 应用
│   │   ├── requirements.txt
│   │   ├── .env          # 环境配置 (不提交)
│   │   └── .env.example
│   ├── js/                # 前端 JavaScript 模块
│   ├── css/               # 样式文件
│   └── lib/               # 第三方库 (d3.v7.min.js, d3-sankey/)
├── static/                # 静态页面
│   ├── index.html         # 主页面
│   └── login.html         # 登录页面
├── scripts/               # 工具脚本
│   ├── deploy/            # 部署脚本
│   ├── database/          # 数据库脚本
│   └── data/              # 数据导入脚本
├── config/                # 配置文件
│   ├── nginx/             # Nginx 配置
│   ├── systemd/           # Systemd 服务配置
│   └── docker-compose.yml
├── docs/                  # 实现文档
│   └── archive/           # 历史归档文档
├── Dockerfile             # 主 Docker 配置
├── Dockerfile.reference.* # 参考配置
└── README.md
```

---

## 快速开始

### Docker 部署 (推荐)

```bash
cd config
docker-compose up -d
# 访问 http://localhost:5000
```

### 开发模式

```bash
# 1. 安装依赖
cd src/api
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 2. 配置环境
cp .env.example .env
# 编辑 .env 填入数据库配置

# 3. 启动服务
cd ../..
python src/api/app.py
# 访问 http://localhost:5000
```

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Python 3.12, Flask, psycopg2 |
| 前端 | HTML5, D3.js v7, d3-sankey |
| 数据库 | PostgreSQL 15+ |

---

## API 端点

| 端点 | 说明 |
|------|------|
| `GET /` | 首页 (需登录) |
| `GET /login.html` | 登录页 |
| `POST /api/auth/login` | 用户登录 |
| `POST /api/auth/logout` | 用户登出 |
| `GET /api/summary` | 获取汇总数据 |
| `GET /api/detail` | 获取明细数据 |
| `GET /api/health` | 健康检查 |

---

## 部署

详见 `docs/archive/` 中的历史部署文档。

---

## 许可证

MIT
