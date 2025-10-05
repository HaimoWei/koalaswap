# GitHub Actions CI/CD 设置指南

## 概述

本项目使用GitHub Actions实现自动化CI/CD流程：

- **CI测试** (`ci-test.yml`): 在PR和develop分支运行测试
- **生产部署** (`deploy-production.yml`): 推送到main分支时自动部署

## 前置要求

### 1. GitHub Secrets 配置

在GitHub仓库设置中添加以下Secrets：

导航到：`Settings` → `Secrets and variables` → `Actions` → `New repository secret`

| Secret名称 | 说明 | 示例值 |
|-----------|------|--------|
| `AWS_ACCESS_KEY_ID` | AWS访问密钥ID | `AKIASCWGGPSQ5EEMG4EC` |
| `AWS_SECRET_ACCESS_KEY` | AWS秘密访问密钥 | `kV07fNWS...` |
| `EC2_SSH_PRIVATE_KEY` | EC2 SSH私钥（完整内容） | `-----BEGIN RSA PRIVATE KEY-----\n...` |
| `EC2_HOST` | EC2公网IP或域名 | `3.104.120.29` |

### 2. 获取EC2 SSH私钥内容

在本地运行：

```bash
cat D:\Code\Project\koalaswap\koalaswap-ec2.pem
```

复制完整内容（包括 `-----BEGIN RSA PRIVATE KEY-----` 和 `-----END RSA PRIVATE KEY-----`）

### 3. AWS IAM权限

确保AWS用户有以下权限：
- ECR: `GetAuthorizationToken`, `BatchCheckLayerAvailability`, `GetDownloadUrlForLayer`, `BatchGetImage`, `PutImage`
- S3: 访问koalaswap bucket的权限

## Workflow说明

### CI测试流程 (`ci-test.yml`)

**触发条件**：
- 创建PR到main或develop分支
- 推送到develop分支

**流程**：
1. **测试后端服务**
   - 启动PostgreSQL和Redis服务
   - 运行Maven测试
   - 构建所有服务

2. **测试前端**
   - 安装依赖
   - 运行linting（可选）
   - 构建前端

3. **测试Docker构建**
   - 验证Docker镜像能够成功构建

### 生产部署流程 (`deploy-production.yml`)

**触发条件**：
- 推送到main分支
- 手动触发（在GitHub Actions页面）

**流程**：

#### Job 1: build-and-push
1. Checkout代码
2. 配置AWS凭证
3. 登录ECR
4. 设置JDK 21
5. Maven构建所有服务
6. 构建并推送7个Docker镜像到ECR

#### Job 2: build-frontend
1. Checkout代码
2. 设置Node.js 20
3. 安装依赖
4. 构建生产版前端
5. 上传构建产物为artifact

#### Job 3: deploy
1. 下载前端构建产物
2. 配置SSH连接
3. 上传前端文件到EC2
4. SSH到EC2执行部署：
   - 登录ECR
   - 拉取最新镜像
   - 重启Docker服务
5. 验证部署
6. 清理SSH密钥

## 使用方法

### 自动部署到生产环境

```bash
# 1. 在本地开发和测试
git checkout develop
# ... 开发代码 ...

# 2. 创建PR到main分支（会触发CI测试）
git checkout -b feature/new-feature
git push origin feature/new-feature
# 在GitHub上创建PR: feature/new-feature → main

# 3. PR通过后合并到main（会自动触发部署）
# 在GitHub上点击 Merge PR

# 4. 查看部署进度
# 在GitHub仓库页面: Actions → Deploy to Production
```

### 手动触发部署

1. 访问GitHub仓库页面
2. 点击 `Actions` 标签
3. 选择 `Deploy to Production` workflow
4. 点击 `Run workflow` 按钮
5. 选择分支（通常是main）
6. 点击 `Run workflow` 确认

## 分支策略建议

```
main (生产环境)
  ↑
  └── develop (开发环境)
        ↑
        └── feature/* (功能分支)
```

### 工作流程

1. **日常开发**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/my-feature
   # ... 开发 ...
   git commit -am "feat: add new feature"
   git push origin feature/my-feature
   ```

2. **创建PR到develop**
   - 在GitHub创建PR: `feature/my-feature` → `develop`
   - 触发CI测试
   - 代码审查
   - 合并到develop

3. **发布到生产**
   - 创建PR: `develop` → `main`
   - 再次运行CI测试
   - 合并后自动部署到生产环境

## 监控部署

### 查看部署日志

1. GitHub Actions页面查看实时日志
2. 或SSH到服务器查看Docker日志：

```bash
ssh -i koalaswap-ec2.pem ubuntu@3.104.120.29
cd /opt/koalaswap
docker compose -f docker-compose.prod.yml logs -f
```

### 回滚部署

如果部署出现问题：

```bash
# 方法1: 在GitHub上回滚commit
git revert HEAD
git push origin main  # 触发重新部署

# 方法2: SSH到服务器手动回滚
ssh -i koalaswap-ec2.pem ubuntu@3.104.120.29
cd /opt/koalaswap

# 拉取上一个版本的镜像（需要知道tag）
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

## 优化建议

### 1. 使用标签版本

修改workflow使用语义化版本：

```yaml
# 在deploy-production.yml中
- name: Get version
  id: version
  run: echo "VERSION=$(git describe --tags --always)" >> $GITHUB_OUTPUT

- name: Build and push with version
  run: |
    docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:user-${{ steps.version.outputs.VERSION }} .
    docker push $ECR_REGISTRY/$ECR_REPOSITORY:user-${{ steps.version.outputs.VERSION }}
```

### 2. 添加Slack/Discord通知

```yaml
- name: Notify on success
  if: success()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "✅ KoalaSwap deployed successfully to production!"
      }
```

### 3. 蓝绿部署

为了零停机部署，可以：
1. 启动新版本容器（新端口）
2. 健康检查通过后切换Nginx配置
3. 停止旧版本容器

### 4. 数据库迁移

如果有数据库schema变更：

```yaml
- name: Run database migrations
  run: |
    ssh -i ~/.ssh/ec2-key.pem ubuntu@${{ secrets.EC2_HOST }} "
      docker exec koalaswap-pg-prod psql -U koalaswap -d koalaswap_prod -f /path/to/migration.sql
    "
```

## 安全最佳实践

1. **定期轮换AWS密钥**
   - 每3-6个月更新AWS访问密钥
   - 更新GitHub Secrets

2. **最小权限原则**
   - 为GitHub Actions创建专用IAM用户
   - 只授予必需的权限

3. **保护main分支**
   - Settings → Branches → Branch protection rules
   - 要求PR审查
   - 要求CI通过才能合并

4. **敏感信息处理**
   - 永远不要在代码中硬编码密钥
   - 使用GitHub Secrets存储敏感信息
   - 使用环境变量传递配置

## 故障排查

### Docker镜像推送失败

```
Error: denied: User: arn:aws:iam::xxx:user/xxx is not authorized
```

**解决**：检查AWS IAM权限，确保用户有ECR访问权限

### SSH连接失败

```
Permission denied (publickey)
```

**解决**：
1. 检查EC2_SSH_PRIVATE_KEY格式正确
2. 确保私钥包含完整内容（包括header和footer）
3. 检查EC2安全组允许GitHub Actions IP访问

### 前端上传失败

**解决**：检查EC2目录权限：
```bash
sudo chown -R ubuntu:ubuntu /opt/koalaswap/frontend-dist
```

## 成本优化

GitHub Actions对公开仓库免费，但私有仓库有限额：
- Free: 2000分钟/月
- 每次完整部署约需15-20分钟

**优化建议**：
1. 只在main分支自动部署
2. develop分支只运行测试
3. 使用缓存减少构建时间
4. 考虑使用自托管runner（Self-hosted runner）

## 下一步

- [ ] 配置GitHub Secrets
- [ ] 测试CI workflow（创建测试PR）
- [ ] 测试生产部署workflow（手动触发）
- [ ] 设置分支保护规则
- [ ] 添加部署通知（可选）
