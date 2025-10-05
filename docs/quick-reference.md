# KoalaSwap 快速参考

## 🚀 快速开始

### 本地开发
```bash
# 启动后端服务
cd infra
docker compose up -d

# 启动前端
cd frontend-web
npm run dev
```

### 部署到生产
```bash
# 方法1: 自动部署（推荐）
git push origin main  # 会触发GitHub Actions自动部署

# 方法2: 手动部署
# 参见 docs/deployment-notes.md
```

## 📋 GitHub Secrets 配置

| Secret | 值 |
|--------|---|
| `AWS_ACCESS_KEY_ID` | `AKIASCWGGPSQ5EEMG4EC` |
| `AWS_SECRET_ACCESS_KEY` | `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` |
| `EC2_SSH_PRIVATE_KEY` | koalaswap-ec2.pem的完整内容 |
| `EC2_HOST` | `3.104.120.29` |

## 🌐 域名和URL

| 服务 | 本地 | 生产 |
|------|------|------|
| 前端 | http://localhost:5173 | https://koalaswap.lightspot.uk |
| API | http://localhost:18080 | https://api.koalaswap.lightspot.uk |
| 数据库 | localhost:15433 | (内网) |

## 💾 数据库

| 环境 | 数据库名 | 用户 | 密码 |
|------|---------|------|------|
| 本地 | koalaswap_dev | koalaswap | secret |
| 生产 | koalaswap_prod | koalaswap | secret |

## 🐳 常用Docker命令

```bash
# 本地开发
cd infra
docker compose up -d              # 启动所有服务
docker compose down               # 停止所有服务
docker compose logs -f [service]  # 查看日志

# 生产环境（SSH到服务器后）
cd /opt/koalaswap
docker compose -f docker-compose.prod.yml ps        # 查看状态
docker compose -f docker-compose.prod.yml logs -f   # 查看日志
docker compose -f docker-compose.prod.yml restart   # 重启所有服务
```

## 🔧 常见任务

### 查看生产环境日志
```bash
ssh -i koalaswap-ec2.pem ubuntu@3.104.120.29
cd /opt/koalaswap
docker compose -f docker-compose.prod.yml logs -f [service-name]
```

### 重启生产服务
```bash
ssh -i koalaswap-ec2.pem ubuntu@3.104.120.29
cd /opt/koalaswap
docker compose -f docker-compose.prod.yml restart [service-name]
```

### 查看服务健康状态
```bash
# API
curl https://api.koalaswap.lightspot.uk/actuator/health

# 前端
curl https://koalaswap.lightspot.uk/health
```

### 更新S3 CORS（如果添加新域名）
```bash
aws s3api put-bucket-cors --bucket koalaswap --cors-configuration '{
  "CORSRules": [{
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedOrigins": [
      "https://koalaswap.lightspot.uk",
      "https://your-new-domain.com"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }]
}'
```

## 📦 服务列表

| 服务 | 端口（本地） | 端口（生产） | 说明 |
|------|------------|------------|------|
| user-service | 12649 | 内网 | 用户服务 |
| product-service | 12648 | 内网 | 商品服务 |
| order-service | 12650 | 内网 | 订单服务 |
| review-service | 12651 | 内网 | 评价服务 |
| chat-service | 12652 | 内网 | 聊天服务 |
| file-service | 12647 | 内网 | 文件服务 |
| gateway-service | 18080 | 18080 | API网关 |
| PostgreSQL | 15433 | 5432 | 数据库 |
| Redis | 16379 | 6379 | 缓存 |

## 🔐 重要文件位置

### 本地
```
koalaswap/
├── .env                          # 本地环境变量（不提交）
├── infra/
│   ├── .env.production          # 生产环境变量模板
│   ├── docker-compose.yml       # 本地Docker配置
│   └── docker-compose.prod.yml  # 生产Docker配置
├── frontend-web/
│   └── .env.production          # 前端生产环境变量
└── koalaswap-ec2.pem            # EC2私钥（不提交）
```

### 生产服务器
```
/opt/koalaswap/
├── .env                         # 生产环境变量
├── docker-compose.prod.yml      # Docker配置
├── nginx/
│   └── koalaswap.conf          # Nginx配置
├── scripts/
│   ├── setup-nginx.sh          # Nginx安装脚本
│   ├── setup-ssl.sh            # SSL证书脚本
│   └── deploy.sh               # 部署脚本
└── frontend-dist/              # 前端构建文件

/data/
├── postgres/                   # PostgreSQL数据
└── redis/                      # Redis数据

/etc/letsencrypt/live/          # SSL证书
```

## ⚠️ 重要提醒

### 不要提交到Git的文件
- ❌ `.env`（本地环境变量）
- ❌ `koalaswap-ec2.pem`（SSH私钥）
- ❌ 任何包含密码、密钥的文件

### 已配置的.gitignore
- ✅ `.env`
- ✅ `*.pem`
- ✅ `node_modules/`
- ✅ `dist/`
- ✅ `target/`

## 🆘 紧急情况

### 网站访问不了
```bash
# 1. 检查服务状态
ssh -i koalaswap-ec2.pem ubuntu@3.104.120.29
cd /opt/koalaswap
docker compose -f docker-compose.prod.yml ps

# 2. 查看Nginx状态
sudo systemctl status nginx

# 3. 重启所有服务
docker compose -f docker-compose.prod.yml restart
sudo systemctl restart nginx
```

### 数据库问题
```bash
# 进入数据库
docker exec -it koalaswap-pg-prod psql -U koalaswap -d koalaswap_prod

# 查看表
\dt

# 查看数据
SELECT COUNT(*) FROM products;
```

### 回滚部署
```bash
# 在GitHub上revert commit，然后推送
git revert HEAD
git push origin main  # 触发自动部署旧版本
```

## 📞 联系方式

- **客服邮箱**: weihaimoau@gmail.com
- **服务器IP**: 3.104.120.29
- **AWS账号**: 143223323809

## 📚 详细文档

- [部署笔记](./deployment-notes.md)
- [GitHub Actions设置](./github-actions-setup.md)
- [部署配置](./deployment-config.md)
