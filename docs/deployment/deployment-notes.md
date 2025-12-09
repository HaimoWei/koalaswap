# KoalaSwap 生产部署笔记

## 重要配置差异

### 1. 数据库名称差异
- **本地开发**: `koalaswap_dev`
- **生产环境**: `koalaswap_prod`

**注意**: 如果从本地导入数据到生产环境，需要重命名数据库：
```sql
ALTER DATABASE koalaswap_dev RENAME TO koalaswap_prod;
```

### 2. S3 CORS 配置

生产域名必须添加到S3 CORS配置中，否则文件上传会失败：

```bash
aws s3api put-bucket-cors --bucket koalaswap --cors-configuration '{
  "CORSRules": [{
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:4200",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:3000",
      "https://www.koalaswap.au",
      "https://img.koalaswap.au",
      "https://koalaswap.lightspot.uk"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }]
}'
```

**当前生产域名**: `https://koalaswap.lightspot.uk`

### 3. 环境变量配置文件

| 文件 | 用途 | 数据库名 |
|------|------|---------|
| `infra/.env` | 本地开发 | koalaswap_dev |
| `infra/.env.production` | 生产环境 | koalaswap_prod |

## 部署流程

### 首次部署完整流程

1. **构建并推送Docker镜像到ECR**
   ```bash
   # 登录ECR
   aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin 143223323809.dkr.ecr.ap-southeast-2.amazonaws.com/koalaswap

   # 构建并推送所有服务
   cd backend
   # ... 构建各个服务
   ```

2. **准备EC2服务器**
   ```bash
   # SSH连接
   ssh -i koalaswap-ec2.pem ubuntu@<your-ec2-ip>

   # 安装Docker和Docker Compose
   sudo apt update
   sudo apt install -y docker.io docker-compose-plugin

   # 创建目录
   sudo mkdir -p /opt/koalaswap
   sudo mkdir -p /data/postgres
   sudo mkdir -p /data/redis
   ```

3. **上传配置文件**
   ```bash
   scp -i koalaswap-ec2.pem infra/docker-compose.prod.yml ubuntu@<your-ec2-ip>:/opt/koalaswap/
   scp -i koalaswap-ec2.pem infra/.env.production ubuntu@<your-ec2-ip>:/opt/koalaswap/.env
   # ... 其他文件
   ```

4. **配置Nginx和SSL**
   ```bash
   sudo /opt/koalaswap/scripts/setup-nginx.sh
   sudo /opt/koalaswap/scripts/setup-ssl.sh
   ```

5. **部署Docker容器**
   ```bash
   cd /opt/koalaswap
   # 登录ECR
   aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin 143223323809.dkr.ecr.ap-southeast-2.amazonaws.com

   # 拉取镜像
   docker compose -f docker-compose.prod.yml pull

   # 启动服务
   docker compose -f docker-compose.prod.yml up -d
   ```

### 后续更新部署流程

1. **本地构建新镜像**
   ```bash
   # 在项目根目录
   cd backend
   # 构建并推送更新的服务镜像
   ```

2. **服务器更新**
   ```bash
   ssh -i koalaswap-ec2.pem ubuntu@<your-ec2-ip>
   cd /opt/koalaswap

   # 登录ECR
   aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin 143223323809.dkr.ecr.ap-southeast-2.amazonaws.com

   # 拉取最新镜像
   docker compose -f docker-compose.prod.yml pull

   # 重启服务（会使用新镜像）
   docker compose -f docker-compose.prod.yml up -d
   ```

## 数据迁移流程

### 从本地迁移数据到生产

1. **导出本地数据卷**
   ```bash
   # 停止本地数据库
   docker stop koalaswap-pg

   # 导出数据卷
   docker run --rm -v infra_koalaswap-db-data:/data alpine tar czf - /data > postgres_data.tar.gz
   ```

2. **上传到服务器**
   ```bash
   scp -i koalaswap-ec2.pem postgres_data.tar.gz ubuntu@<your-ec2-ip>:/tmp/
   ```

3. **在服务器上导入**
   ```bash
   # 停止数据库
   docker compose -f docker-compose.prod.yml stop db

   # 清空并导入数据
   sudo rm -rf /data/postgres/*
   sudo tar xzf /tmp/postgres_data.tar.gz -C /data/postgres
   sudo chown -R 999:999 /data/postgres

   # 重命名数据库（如果需要）
   docker compose -f docker-compose.prod.yml start db
   docker exec koalaswap-pg-prod psql -U koalaswap -d postgres -c 'ALTER DATABASE koalaswap_dev RENAME TO koalaswap_prod;'

   # 重启所有服务
   docker compose -f docker-compose.prod.yml restart
   ```

## 常见问题

### 1. 数据库连接失败
**错误**: `database "koalaswap_prod" does not exist`

**解决**:
- 检查数据库是否使用正确的名称
- 如果从本地迁移，需要重命名数据库

### 2. 图片上传失败
**错误**: CORS错误

**解决**:
- 检查S3 CORS配置是否包含生产域名
- 使用上面的命令更新CORS配置

### 3. 服务启动失败
**解决**:
```bash
# 查看日志
docker compose -f docker-compose.prod.yml logs -f [service-name]

# 检查服务状态
docker compose -f docker-compose.prod.yml ps

# 重启特定服务
docker compose -f docker-compose.prod.yml restart [service-name]
```

## 监控和维护

### 查看服务状态
```bash
docker compose -f docker-compose.prod.yml ps
```

### 查看日志
```bash
# 所有服务
docker compose -f docker-compose.prod.yml logs -f

# 特定服务
docker compose -f docker-compose.prod.yml logs -f user-service
```

### 健康检查
```bash
# API网关
curl https://api.koalaswap.lightspot.uk/actuator/health

# 前端
curl https://koalaswap.lightspot.uk/health
```

### SSL证书续期
证书会自动续期（配置了cron任务，每天运行2次）。

手动续期：
```bash
sudo certbot renew
sudo systemctl reload nginx
```

## 重要文件位置

| 类型 | 路径 |
|------|------|
| Docker配置 | `/opt/koalaswap/docker-compose.prod.yml` |
| 环境变量 | `/opt/koalaswap/.env` |
| Nginx配置 | `/opt/koalaswap/nginx/koalaswap.conf` |
| 前端文件 | `/opt/koalaswap/frontend-dist/` |
| PostgreSQL数据 | `/data/postgres/` |
| Redis数据 | `/data/redis/` |
| SSL证书 | `/etc/letsencrypt/live/` |
| 日志 | `docker compose logs` |

## 域名和URL

| 服务 | URL |
|------|-----|
| 前端 | https://koalaswap.lightspot.uk |
| API网关 | https://api.koalaswap.lightspot.uk |
| 图片CDN | https://d3367sa0s3hyt3.cloudfront.net |

## 安全注意事项

1. **不要提交敏感信息到Git**
   - `.env` 文件已在 `.gitignore` 中
   - 密钥和密码保存在服务器上

2. **定期更新**
   - 定期更新依赖包
   - 定期更新Docker镜像
   - 监控安全漏洞

3. **备份**
   - 定期备份PostgreSQL数据
   - 定期备份配置文件

## 更新检查清单

每次更新镜像前检查：

- [ ] 本地测试通过
- [ ] 数据库迁移脚本（Flyway）已准备
- [ ] 环境变量没有遗漏
- [ ] S3 CORS配置包含生产域名
- [ ] Docker镜像已推送到ECR
- [ ] 备份了当前生产数据
