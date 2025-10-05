# KoalaSwap 生产部署清单

## ✅ 已完成的准备工作

### 1. Docker 镜像（已推送到 ECR）
- [x] user-service → `143223323809.dkr.ecr.ap-southeast-2.amazonaws.com/koalaswap:user-prod`
- [x] product-service → `143223323809.dkr.ecr.ap-southeast-2.amazonaws.com/koalaswap:product-prod`
- [x] order-service → `143223323809.dkr.ecr.ap-southeast-2.amazonaws.com/koalaswap:order-prod`
- [x] review-service → `143223323809.dkr.ecr.ap-southeast-2.amazonaws.com/koalaswap:review-prod`
- [x] chat-service → `143223323809.dkr.ecr.ap-southeast-2.amazonaws.com/koalaswap:chat-prod`
- [x] file-service → `143223323809.dkr.ecr.ap-southeast-2.amazonaws.com/koalaswap:file-prod`
- [x] gateway-service → `143223323809.dkr.ecr.ap-southeast-2.amazonaws.com/koalaswap:gateway-prod`

### 2. 前端构建
- [x] 生产环境配置：`frontend-web/.env.production`
- [x] 构建产物：`frontend-web/dist/`（已生成）

### 3. 部署配置文件
- [x] `infra/docker-compose.prod.yml` - 生产环境 Docker Compose 配置
- [x] `infra/.env.production` - 生产环境变量模板
- [x] `infra/nginx/koalaswap.conf` - Nginx 配置
- [x] `infra/scripts/setup-nginx.sh` - Nginx 安装脚本
- [x] `infra/scripts/setup-ssl.sh` - SSL 证书申请脚本
- [x] `infra/scripts/deploy.sh` - 自动化部署脚本
- [x] `docs/deployment-guide.md` - 完整部署文档

---

## 📋 待执行的部署步骤

### 步骤 1：EC2 初始化
```bash
# 1.1 SSH 登录 EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# 1.2 安装 Docker + Docker Compose + AWS CLI
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
sudo apt-get install -y docker-compose-plugin awscli
exit
```

### 步骤 2：DNS 配置
- [ ] 添加 A 记录：`koalaswap.lightspot.uk` → EC2 公网 IP
- [ ] 添加 A 记录：`api.lightspot.uk` → EC2 公网 IP
- [ ] 等待 DNS 传播（1-5 分钟）

### 步骤 3：上传文件到 EC2

**在本地执行：**
```bash
# 3.1 创建目录
ssh -i your-key.pem ubuntu@your-ec2-ip "sudo mkdir -p /opt/koalaswap/{nginx,scripts}"
ssh -i your-key.pem ubuntu@your-ec2-ip "sudo chown -R ubuntu:ubuntu /opt/koalaswap"

# 3.2 上传配置文件
scp -i your-key.pem infra/docker-compose.prod.yml ubuntu@your-ec2-ip:/opt/koalaswap/
scp -i your-key.pem infra/.env.production ubuntu@your-ec2-ip:/opt/koalaswap/.env
scp -i your-key.pem infra/nginx/koalaswap.conf ubuntu@your-ec2-ip:/opt/koalaswap/nginx/
scp -i your-key.pem infra/scripts/*.sh ubuntu@your-ec2-ip:/opt/koalaswap/scripts/

# 3.3 上传前端
scp -i your-key.pem -r frontend-web/dist/* ubuntu@your-ec2-ip:/tmp/frontend-dist/
```

### 步骤 4：配置环境变量

**在 EC2 上执行：**
```bash
# 4.1 编辑 .env 文件
nano /opt/koalaswap/.env

# 4.2 修改以下配置（重要！）：
# - POSTGRES_PASSWORD=强密码
# - REDIS_PASSWORD=强密码
# - 其他配置保持不变（AWS 凭证等已正确配置）
```

### 步骤 5：设置 Nginx
```bash
sudo /opt/koalaswap/scripts/setup-nginx.sh
```

### 步骤 6：申请 SSL 证书
```bash
sudo /opt/koalaswap/scripts/setup-ssl.sh
```

### 步骤 7：启用 HTTPS Nginx 配置
```bash
sudo rm /etc/nginx/sites-enabled/koalaswap-temp
sudo ln -s /etc/nginx/sites-available/koalaswap /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 步骤 8：部署应用
```bash
# 8.1 配置 AWS CLI
aws configure
# 输入 AWS 凭证（从 .env 获取）

# 8.2 运行部署
sudo /opt/koalaswap/scripts/deploy.sh
```

### 步骤 9：验证部署
```bash
# 9.1 检查服务状态
docker compose -f /opt/koalaswap/docker-compose.prod.yml ps

# 9.2 测试网关
curl http://localhost:18080/actuator/health

# 9.3 测试 API
curl https://api.lightspot.uk/actuator/health

# 9.4 访问前端
# 浏览器打开：https://koalaswap.lightspot.uk
```

---

## 🔧 重要配置说明

### S3 CORS 配置（已完成 ✓）
S3 bucket `koalaswap` 的 CORS 已配置为允许：
- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `https://koalaswap.lightspot.uk` ← 生产环境前端域名

### 数据持久化
所有数据存储在 EC2 的 `/data` 目录：
- PostgreSQL: `/data/postgres`
- Redis: `/data/redis`

### 端口映射
- Nginx: 80, 443（对外）
- Gateway: 18080（仅本地）
- 各微服务: 12647-12652（仅本地）
- PostgreSQL: 5432（仅本地）
- Redis: 6379（仅本地）

---

## 🚀 快速部署脚本（可选）

创建 `quick-deploy.sh` 并在本地执行：

```bash
#!/bin/bash
EC2_IP="your-ec2-ip"
KEY_FILE="your-key.pem"

echo "=== KoalaSwap 快速部署 ==="

# 上传文件
echo "1. 上传配置文件..."
ssh -i $KEY_FILE ubuntu@$EC2_IP "sudo mkdir -p /opt/koalaswap/{nginx,scripts} && sudo chown -R ubuntu:ubuntu /opt/koalaswap"
scp -i $KEY_FILE infra/docker-compose.prod.yml ubuntu@$EC2_IP:/opt/koalaswap/
scp -i $KEY_FILE infra/.env.production ubuntu@$EC2_IP:/opt/koalaswap/.env
scp -i $KEY_FILE infra/nginx/koalaswap.conf ubuntu@$EC2_IP:/opt/koalaswap/nginx/
scp -i $KEY_FILE infra/scripts/*.sh ubuntu@$EC2_IP:/opt/koalaswap/scripts/
scp -i $KEY_FILE -r frontend-web/dist/* ubuntu@$EC2_IP:/tmp/frontend-dist/

# 部署
echo "2. 执行部署..."
ssh -i $KEY_FILE ubuntu@$EC2_IP << 'EOF'
  chmod +x /opt/koalaswap/scripts/*.sh
  sudo mkdir -p /opt/koalaswap/frontend-dist
  sudo mv /tmp/frontend-dist/* /opt/koalaswap/frontend-dist/
  sudo /opt/koalaswap/scripts/setup-nginx.sh
  sudo /opt/koalaswap/scripts/setup-ssl.sh
  sudo rm -f /etc/nginx/sites-enabled/koalaswap-temp
  sudo ln -sf /etc/nginx/sites-available/koalaswap /etc/nginx/sites-enabled/
  sudo nginx -t && sudo systemctl reload nginx
  sudo /opt/koalaswap/scripts/deploy.sh
EOF

echo "=== 部署完成 ==="
echo "访问前端：https://koalaswap.lightspot.uk"
echo "API 地址：https://api.lightspot.uk"
```

---

## 📞 支持和文档

- **完整部署文档**：`docs/deployment-guide.md`
- **Docker Compose 配置**：`infra/docker-compose.prod.yml`
- **Nginx 配置**：`infra/nginx/koalaswap.conf`
- **环境变量模板**：`infra/.env.production`

---

## ✅ 部署完成标志

当以下所有项都通过时，部署成功：

- [ ] `https://koalaswap.lightspot.uk` 可访问
- [ ] `https://api.lightspot.uk/actuator/health` 返回 `{"status":"UP"}`
- [ ] 前端可以正常登录注册
- [ ] 可以发布商品
- [ ] 图片上传成功（S3）
- [ ] 聊天功能正常（WebSocket）
- [ ] SSL 证书有效（浏览器无警告）
- [ ] 所有 9 个 Docker 容器状态为 `healthy`
