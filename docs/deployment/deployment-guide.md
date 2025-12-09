# KoalaSwap 生产环境部署指南

## 概述

本文档介绍如何将 KoalaSwap 部署到 AWS EC2 生产环境。

**域名配置：**
- 前端：https://koalaswap.lightspot.uk
- API：https://api.lightspot.uk

**部署架构：**
- EC2 实例运行 Docker Compose 管理所有微服务
- Nginx 作为反向代理和静态文件服务器
- PostgreSQL 和 Redis 数据持久化到 `/data` 目录
- Let's Encrypt 自动管理 SSL 证书

---

## 前置条件

### 1. EC2 实例要求
- **实例类型**：建议 t3.medium 或更高（2 vCPU, 4GB RAM）
- **操作系统**：Ubuntu 22.04 LTS
- **存储**：至少 30GB SSD
- **安全组规则**：
  - 22 (SSH)
  - 80 (HTTP)
  - 443 (HTTPS)

### 2. DNS 配置
在你的 DNS 提供商处添加以下 A 记录：
- `koalaswap.lightspot.uk` → EC2 公网 IP
- `api.lightspot.uk` → EC2 公网 IP

### 3. 本地准备
- Docker 镜像已推送到 ECR（完成 ✓）
- 前端已构建生产版本（完成 ✓）

---

## 部署步骤

### 第一步：初始化 EC2 实例

```bash
# SSH 登录到 EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# 更新系统
sudo apt-get update && sudo apt-get upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# 安装 Docker Compose
sudo apt-get install -y docker-compose-plugin

# 安装 AWS CLI
sudo apt-get install -y awscli

# 退出并重新登录以使 Docker 权限生效
exit
```

### 第二步：上传部署文件到 EC2

在本地机器上执行：

```bash
# 创建部署目录
ssh -i your-key.pem ubuntu@your-ec2-ip "sudo mkdir -p /opt/koalaswap/{nginx,scripts}"
ssh -i your-key.pem ubuntu@your-ec2-ip "sudo chown -R ubuntu:ubuntu /opt/koalaswap"

# 上传 docker-compose 文件
scp -i your-key.pem infra/docker-compose.prod.yml ubuntu@your-ec2-ip:/opt/koalaswap/

# 上传 .env 文件
scp -i your-key.pem infra/.env.production ubuntu@your-ec2-ip:/opt/koalaswap/.env

# 上传 Nginx 配置
scp -i your-key.pem infra/nginx/koalaswap.conf ubuntu@your-ec2-ip:/opt/koalaswap/nginx/

# 上传脚本
scp -i your-key.pem infra/scripts/*.sh ubuntu@your-ec2-ip:/opt/koalaswap/scripts/

# 上传前端构建产物
scp -i your-key.pem -r frontend-web/dist/* ubuntu@your-ec2-ip:/tmp/frontend-dist/
```

### 第三步：准备生产环境

SSH 回到 EC2 实例：

```bash
# 设置脚本权限
chmod +x /opt/koalaswap/scripts/*.sh

# 创建数据持久化目录
sudo mkdir -p /data/postgres /data/redis
sudo chmod 700 /data/postgres /data/redis

# 移动前端文件
sudo mkdir -p /opt/koalaswap/frontend-dist
sudo mv /tmp/frontend-dist/* /opt/koalaswap/frontend-dist/

# 配置 .env 文件（如果需要修改密码等）
nano /opt/koalaswap/.env
# 确保设置强密码：
# - POSTGRES_PASSWORD
# - REDIS_PASSWORD
```

### 第四步：设置 Nginx

```bash
# 运行 Nginx 设置脚本
sudo /opt/koalaswap/scripts/setup-nginx.sh
```

此脚本会：
1. 安装 Nginx
2. 创建必要的目录
3. 配置临时 HTTP 服务器（用于 Let's Encrypt 验证）

### 第五步：获取 SSL 证书

```bash
# 运行 SSL 设置脚本
sudo /opt/koalaswap/scripts/setup-ssl.sh
```

此脚本会：
1. 安装 Certbot
2. 为两个域名申请 Let's Encrypt 证书
3. 配置自动续期（每天两次检查）

### 第六步：启用完整 Nginx 配置

```bash
# 移除临时配置
sudo rm /etc/nginx/sites-enabled/koalaswap-temp

# 启用生产配置
sudo ln -s /etc/nginx/sites-available/koalaswap /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

### 第七步：部署应用

```bash
# 配置 AWS 凭证（用于拉取 ECR 镜像）
aws configure
# 输入：
# - AWS Access Key ID: <your-aws-access-key-id>
# - AWS Secret Access Key: <your-aws-secret-access-key>
# - Default region: ap-southeast-2
# - Default output format: json

# 运行部署脚本
sudo /opt/koalaswap/scripts/deploy.sh
```

此脚本会：
1. 创建数据目录
2. 登录 ECR
3. 拉取最新镜像
4. 启动所有服务
5. 等待服务健康检查通过
6. 显示部署状态

---

## 验证部署

### 1. 检查服务状态

```bash
cd /opt/koalaswap
docker compose -f docker-compose.prod.yml ps
```

所有服务应显示为 `healthy`。

### 2. 检查网关健康

```bash
curl http://localhost:18080/actuator/health
```

应返回：`{"status":"UP"}`

### 3. 访问前端

打开浏览器访问：https://koalaswap.lightspot.uk

### 4. 测试 API

```bash
curl https://api.lightspot.uk/actuator/health
```

### 5. 查看日志

```bash
# 查看所有服务日志
docker compose -f /opt/koalaswap/docker-compose.prod.yml logs -f

# 查看特定服务日志
docker compose -f /opt/koalaswap/docker-compose.prod.yml logs -f gateway-service
```

---

## 更新部署

### 更新后端服务

```bash
# 1. 在本地构建并推送新镜像到 ECR
cd backend
docker build -f user-service/Dockerfile -t 143223323809.dkr.ecr.ap-southeast-2.amazonaws.com/koalaswap:user-prod .
docker push 143223323809.dkr.ecr.ap-southeast-2.amazonaws.com/koalaswap:user-prod

# 2. 在 EC2 上重新部署
ssh -i your-key.pem ubuntu@your-ec2-ip
sudo /opt/koalaswap/scripts/deploy.sh
```

### 更新前端

```bash
# 1. 在本地构建新版本
cd frontend-web
npm run build

# 2. 上传到 EC2
scp -i your-key.pem -r dist/* ubuntu@your-ec2-ip:/tmp/frontend-dist/

# 3. 在 EC2 上更新文件
ssh -i your-key.pem ubuntu@your-ec2-ip
sudo rm -rf /opt/koalaswap/frontend-dist/*
sudo mv /tmp/frontend-dist/* /opt/koalaswap/frontend-dist/

# 4. Nginx 会自动服务新文件（无需重启）
```

---

## 故障排查

### 服务无法启动

```bash
# 查看服务日志
docker compose -f /opt/koalaswap/docker-compose.prod.yml logs [service-name]

# 常见问题：
# 1. 数据库连接失败 → 检查 .env 中的密码配置
# 2. Redis 连接失败 → 检查 REDIS_PASSWORD 是否正确
# 3. 健康检查失败 → 等待更长时间或检查服务日志
```

### SSL 证书问题

```bash
# 手动续期证书
sudo certbot renew --dry-run

# 重新申请证书
sudo certbot delete --cert-name koalaswap.lightspot.uk
sudo /opt/koalaswap/scripts/setup-ssl.sh
```

### Nginx 错误

```bash
# 检查配置
sudo nginx -t

# 查看错误日志
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/api.lightspot.uk.error.log
```

### 数据备份

```bash
# 备份 PostgreSQL
docker exec koalaswap-pg-prod pg_dump -U koalaswap koalaswap_prod > backup_$(date +%Y%m%d).sql

# 备份 Redis
docker exec koalaswap-redis-prod redis-cli --no-auth-warning -a your_redis_password BGSAVE

# 备份文件
sudo tar -czf /tmp/koalaswap-backup-$(date +%Y%m%d).tar.gz \
  /data/postgres \
  /data/redis \
  /opt/koalaswap/.env
```

---

## 监控和维护

### 定期检查

```bash
# 磁盘空间
df -h

# Docker 日志大小
sudo du -sh /var/lib/docker/containers/*/*-json.log

# 服务健康
docker compose -f /opt/koalaswap/docker-compose.prod.yml ps
```

### 清理旧镜像

```bash
# 清理未使用的 Docker 资源
docker system prune -a --volumes
```

### 性能监控

建议安装监控工具：
- Prometheus + Grafana
- CloudWatch Agent
- 或使用 Spring Boot Actuator 的 metrics 端点

---

## 安全建议

1. **定期更新**：
   ```bash
   sudo apt-get update && sudo apt-get upgrade -y
   ```

2. **配置防火墙**：
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

3. **限制 SSH 访问**：
   - 使用密钥认证
   - 禁用密码登录
   - 考虑更改 SSH 端口

4. **数据库安全**：
   - PostgreSQL 只监听 127.0.0.1（已配置）
   - 使用强密码
   - 定期备份

5. **密钥管理**：
   - 定期轮换密码
   - 使用 AWS Secrets Manager（可选）

---

## 总结

部署完成后的架构：

```
Internet
   │
   ├─→ https://koalaswap.lightspot.uk → Nginx → /opt/koalaswap/frontend-dist
   │
   └─→ https://api.lightspot.uk → Nginx → gateway-service:18080
                                              │
                                              ├─→ user-service:12649
                                              ├─→ product-service:12648
                                              ├─→ order-service:12650
                                              ├─→ review-service:12651
                                              ├─→ chat-service:12652
                                              └─→ file-service:12647
                                                     │
                                                     ├─→ PostgreSQL (db:5432)
                                                     └─→ Redis (redis:6379)
```

所有数据持久化到 `/data` 目录，自动备份和监控可根据需要配置。

**完成！** 🎉
