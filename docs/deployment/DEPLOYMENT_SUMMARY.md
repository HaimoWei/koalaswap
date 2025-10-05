# KoalaSwap 生产部署总结

## 🎉 部署准备完成！

所有生产环境部署文件已准备就绪，可以直接部署到 AWS EC2。

---

## 📦 已完成的工作

### 1. Docker 镜像构建与推送 ✅
所有 7 个微服务镜像已成功推送到 ECR：

| 服务 | ECR 镜像标签 | 状态 |
|------|-------------|------|
| user-service | `user-prod` | ✅ 已推送 |
| product-service | `product-prod` | ✅ 已推送 |
| order-service | `order-prod` | ✅ 已推送 |
| review-service | `review-prod` | ✅ 已推送 |
| chat-service | `chat-prod` | ✅ 已推送 |
| file-service | `file-prod` | ✅ 已推送 |
| gateway-service | `gateway-prod` | ✅ 已推送 |

**ECR 仓库**：`143223323809.dkr.ecr.ap-southeast-2.amazonaws.com/koalaswap`

### 2. 前端构建 ✅
- **配置文件**：`frontend-web/.env.production`（指向生产 API）
- **构建产物**：`frontend-web/dist/`（700KB gzipped）
- **构建时间**：2.1 秒

### 3. 部署配置文件 ✅

| 文件 | 路径 | 说明 |
|------|------|------|
| Docker Compose 生产配置 | `infra/docker-compose.prod.yml` | 定义所有服务、网络、卷 |
| 生产环境变量 | `infra/.env.production` | 基于现有 .env 优化 |
| Nginx 配置 | `infra/nginx/koalaswap.conf` | 前端 + API 反向代理 + HTTPS |
| Nginx 安装脚本 | `infra/scripts/setup-nginx.sh` | 自动安装和配置 Nginx |
| SSL 证书脚本 | `infra/scripts/setup-ssl.sh` | Let's Encrypt 自动申请 |
| 部署脚本 | `infra/scripts/deploy.sh` | 一键部署和健康检查 |
| 完整部署文档 | `docs/deployment-guide.md` | 详细步骤说明 |
| 部署清单 | `DEPLOYMENT_CHECKLIST.md` | 快速参考清单 |

---

## 🏗️ 生产架构

```
Internet
   │
   ├─ https://koalaswap.lightspot.uk (443)
   │     │
   │     └─→ Nginx ─→ /opt/koalaswap/frontend-dist (React SPA)
   │
   └─ https://api.lightspot.uk (443)
         │
         └─→ Nginx ─→ Gateway Service (18080)
                          │
                          ├─→ User Service (12649) ──┐
                          ├─→ Product Service (12648) │
                          ├─→ Order Service (12650)   ├─→ PostgreSQL (5432)
                          ├─→ Review Service (12651)  │
                          ├─→ Chat Service (12652) ───┤
                          └─→ File Service (12647) ───┴─→ Redis (6379)
                                     │
                                     └─→ AWS S3 (图片存储)
```

### 关键配置

| 组件 | 配置 |
|------|------|
| **域名** | `koalaswap.lightspot.uk`, `api.lightspot.uk` |
| **SSL** | Let's Encrypt（自动续期） |
| **数据持久化** | `/data/postgres`, `/data/redis` |
| **日志** | JSON 格式，10MB x 3 文件轮转 |
| **健康检查** | 所有服务 20s 间隔 |
| **启动顺序** | DB → Redis → User → File/Product → Order → Review/Chat → Gateway |

---

## 🚀 快速部署指令

### 前提条件
1. EC2 实例已创建（Ubuntu 22.04, t3.medium+）
2. DNS 已配置（两个 A 记录指向 EC2 IP）
3. 安全组开放 22, 80, 443 端口

### 一键部署（在本地执行）

```bash
# 1. 设置变量
export EC2_IP="your-ec2-ip"
export KEY_FILE="path/to/your-key.pem"

# 2. 初始化 EC2
ssh -i $KEY_FILE ubuntu@$EC2_IP << 'EOF'
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
sudo apt-get install -y docker-compose-plugin awscli
EOF

# 3. 上传文件
ssh -i $KEY_FILE ubuntu@$EC2_IP "sudo mkdir -p /opt/koalaswap/{nginx,scripts} && sudo chown -R ubuntu:ubuntu /opt/koalaswap"
scp -i $KEY_FILE infra/docker-compose.prod.yml ubuntu@$EC2_IP:/opt/koalaswap/
scp -i $KEY_FILE infra/.env.production ubuntu@$EC2_IP:/opt/koalaswap/.env
scp -i $KEY_FILE infra/nginx/koalaswap.conf ubuntu@$EC2_IP:/opt/koalaswap/nginx/
scp -i $KEY_FILE infra/scripts/*.sh ubuntu@$EC2_IP:/opt/koalaswap/scripts/
scp -i $KEY_FILE -r frontend-web/dist/* ubuntu@$EC2_IP:/tmp/frontend-dist/

# 4. 部署
ssh -i $KEY_FILE ubuntu@$EC2_IP << 'EOF'
chmod +x /opt/koalaswap/scripts/*.sh
sudo mkdir -p /opt/koalaswap/frontend-dist
sudo mv /tmp/frontend-dist/* /opt/koalaswap/frontend-dist/
aws configure  # 输入 AWS 凭证
sudo /opt/koalaswap/scripts/setup-nginx.sh
sudo /opt/koalaswap/scripts/setup-ssl.sh
sudo rm -f /etc/nginx/sites-enabled/koalaswap-temp
sudo ln -sf /etc/nginx/sites-available/koalaswap /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo /opt/koalaswap/scripts/deploy.sh
EOF
```

---

## ✅ 部署验证清单

完成部署后，验证以下项目：

```bash
# 1. 检查 Docker 容器
docker compose -f /opt/koalaswap/docker-compose.prod.yml ps
# 期望：9 个容器全部 healthy

# 2. 测试网关健康
curl http://localhost:18080/actuator/health
# 期望：{"status":"UP"}

# 3. 测试 API
curl https://api.lightspot.uk/actuator/health
# 期望：{"status":"UP"}

# 4. 访问前端
open https://koalaswap.lightspot.uk
# 期望：页面正常加载，无 SSL 警告

# 5. 测试完整流程
# - 注册用户
# - 登录
# - 发布商品（测试图片上传）
# - 创建订单
# - 发送聊天消息
```

---

## 📊 性能与资源

### 预期资源使用
- **CPU**：2-4 vCPU（t3.medium 或 t3.large）
- **内存**：3-4 GB
- **存储**：20-30 GB（初始）+ 数据增长
- **网络**：入站 HTTPS 流量主要

### Docker 镜像大小
- 每个微服务镜像：~300-400 MB
- 前端资源：~700 KB（gzipped）

### 启动时间
- 数据库初始化：~10 秒
- 所有服务健康：~60-90 秒

---

## 🔒 安全配置

### 已配置
- ✅ HTTPS（Let's Encrypt）
- ✅ JWT 认证（64 字节密钥）
- ✅ Redis 密码保护
- ✅ PostgreSQL 密码保护
- ✅ 服务仅监听 127.0.0.1（除 Nginx）
- ✅ CORS 限制为生产域名
- ✅ Docker 日志大小限制

### 建议额外配置
- [ ] 配置 UFW 防火墙
- [ ] 禁用 SSH 密码登录
- [ ] 配置 fail2ban
- [ ] 启用 CloudWatch 监控
- [ ] 定期数据库备份脚本

---

## 📚 相关文档

1. **完整部署指南**：`docs/deployment-guide.md`
2. **部署清单**：`DEPLOYMENT_CHECKLIST.md`
3. **本地 Docker 配置**：`infra/docker-compose.yml`
4. **环境变量说明**：查看 `.env` 文件注释

---

## 🎯 后续优化建议

### 短期（部署后 1-2 周）
- [ ] 配置监控和告警
- [ ] 设置自动备份
- [ ] 优化数据库索引
- [ ] 配置 CDN 缓存策略

### 中期（1-3 个月）
- [ ] 设置 CI/CD 流水线（GitHub Actions）
- [ ] 配置日志聚合（ELK 或 CloudWatch Logs）
- [ ] 实施性能监控（Prometheus + Grafana）
- [ ] 数据库读写分离（如需要）

### 长期（3+ 个月）
- [ ] Kubernetes 迁移（弹性伸缩）
- [ ] 多区域部署（高可用）
- [ ] 服务网格（Istio/Linkerd）
- [ ] 自动化测试覆盖

---

## 💡 快速问题解决

### 部署失败
```bash
# 查看日志
docker compose -f /opt/koalaswap/docker-compose.prod.yml logs -f

# 重新部署
sudo /opt/koalaswap/scripts/deploy.sh
```

### SSL 证书失败
```bash
# 检查 DNS
nslookup koalaswap.lightspot.uk
nslookup api.lightspot.uk

# 重新申请
sudo /opt/koalaswap/scripts/setup-ssl.sh
```

### 服务不健康
```bash
# 查看特定服务
docker logs koalaswap-[service-name]-prod

# 重启服务
docker restart koalaswap-[service-name]-prod
```

---

## 🎉 总结

✅ **所有准备工作已完成！**

你现在可以按照 `DEPLOYMENT_CHECKLIST.md` 或 `docs/deployment-guide.md` 中的步骤进行部署。

预计总部署时间：**30-45 分钟**（包括 DNS 传播等待）

祝部署顺利！🚀
