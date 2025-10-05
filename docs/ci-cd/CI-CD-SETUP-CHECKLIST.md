# CI/CD 设置检查清单

按照以下步骤设置GitHub Actions自动部署。

## ✅ 步骤1: 准备GitHub Secrets

### 1.1 获取EC2 SSH私钥
```bash
# 在本地运行，复制输出内容
cat D:\Code\Project\koalaswap\koalaswap-ec2.pem
```

### 1.2 在GitHub添加Secrets

1. 访问你的GitHub仓库
2. 点击 `Settings` → `Secrets and variables` → `Actions`
3. 点击 `New repository secret`
4. 逐一添加以下secrets：

| Name | Value |
|------|-------|
| `AWS_ACCESS_KEY_ID` | `AKIASCWGGPSQ5EEMG4EC` |
| `AWS_SECRET_ACCESS_KEY` | `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` |
| `EC2_SSH_PRIVATE_KEY` | 完整的.pem文件内容（包括BEGIN和END行） |
| `EC2_HOST` | `3.104.120.29` |

**重要**: `EC2_SSH_PRIVATE_KEY`必须包含完整内容，格式如：
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
...（中间很多行）...
...
-----END RSA PRIVATE KEY-----
```

## ✅ 步骤2: 提交Workflow文件

```bash
# 确保workflow文件已创建
ls -la .github/workflows/

# 应该看到:
# ci-test.yml
# deploy-production.yml

# 提交到Git
git add .github/workflows/
git add docs/
git commit -m "feat: add GitHub Actions CI/CD workflows"
git push origin main
```

## ✅ 步骤3: 测试CI流程

### 3.1 创建测试分支
```bash
git checkout -b test/ci-workflow
echo "# Test CI" >> README.md
git add README.md
git commit -m "test: trigger CI workflow"
git push origin test/ci-workflow
```

### 3.2 创建Pull Request
1. 在GitHub上创建PR: `test/ci-workflow` → `main`
2. 查看 `Actions` 标签，应该看到CI测试运行
3. 等待CI通过（绿色✓）

### 3.3 检查CI结果
- ✅ Backend tests passed
- ✅ Frontend build succeeded
- ✅ Docker build test passed

如果失败，点击查看日志排查问题。

## ✅ 步骤4: 测试部署流程

### 4.1 手动触发部署（推荐）
1. 访问 `Actions` 标签
2. 选择 `Deploy to Production`
3. 点击 `Run workflow`
4. 选择 `main` 分支
5. 点击 `Run workflow` 确认

### 4.2 观察部署过程
部署分3个阶段：
1. **Build and Push** (~10分钟)
   - Maven构建
   - Docker镜像构建和推送

2. **Build Frontend** (~2分钟)
   - npm构建
   - 上传artifact

3. **Deploy** (~5分钟)
   - 下载前端构建
   - 上传到EC2
   - 拉取镜像
   - 重启服务
   - 健康检查

### 4.3 验证部署成功
```bash
# 检查健康状态
curl https://api.koalaswap.lightspot.uk/actuator/health
curl https://koalaswap.lightspot.uk/health

# 或访问网站
open https://koalaswap.lightspot.uk
```

## ✅ 步骤5: 设置分支保护（推荐）

### 5.1 保护main分支
1. `Settings` → `Branches` → `Add branch protection rule`
2. Branch name pattern: `main`
3. 勾选以下选项：
   - ✅ Require a pull request before merging
   - ✅ Require approvals (1)
   - ✅ Require status checks to pass before merging
     - 选择: `Test Backend Services`
     - 选择: `Test Frontend`
   - ✅ Require conversation resolution before merging
4. 点击 `Create`

### 5.2 保护develop分支（可选）
重复上述步骤，但branch name pattern改为 `develop`

## ✅ 步骤6: 建立分支策略

### 推荐的工作流程
```
main (生产)
  ↑ (需要PR + CI通过)
  |
develop (开发)
  ↑ (需要PR)
  |
feature/* (功能分支)
```

### 创建develop分支
```bash
git checkout main
git pull origin main
git checkout -b develop
git push origin develop
```

## 📝 日常使用

### 开发新功能
```bash
# 1. 从develop创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/my-new-feature

# 2. 开发代码
# ... 编码 ...

# 3. 提交
git add .
git commit -m "feat: add my new feature"
git push origin feature/my-new-feature

# 4. 在GitHub创建PR: feature/my-new-feature → develop
# 5. 等待CI通过，代码审查
# 6. 合并PR
```

### 发布到生产
```bash
# 1. 在GitHub创建PR: develop → main
# 2. 等待CI通过，最终审查
# 3. 合并PR
# 4. GitHub Actions自动部署到生产环境
# 5. 验证部署成功
```

## 🐛 故障排查

### GitHub Actions失败

#### 问题1: SSH连接失败
```
Permission denied (publickey)
```

**解决**:
- 检查`EC2_SSH_PRIVATE_KEY`是否包含完整内容
- 检查是否包含`-----BEGIN`和`-----END`行
- 检查EC2安全组是否允许GitHub Actions IP

#### 问题2: ECR权限错误
```
denied: User is not authorized to perform: ecr:GetAuthorizationToken
```

**解决**:
- 检查AWS IAM用户权限
- 确保有ECR完整访问权限

#### 问题3: Maven构建失败
```
BUILD FAILURE
```

**解决**:
- 查看详细日志
- 确保本地能正常构建
- 检查依赖是否正确

#### 问题4: Docker镜像推送失败
```
failed to push manifest
```

**解决**:
- 检查ECR仓库是否存在
- 检查网络连接
- 重试workflow

### 查看详细日志

1. 在GitHub Actions页面点击失败的workflow
2. 点击失败的步骤
3. 展开查看详细日志
4. 复制错误信息搜索解决方案

## ✨ 高级功能（可选）

### 添加Slack通知

1. 创建Slack Webhook
2. 添加到GitHub Secrets: `SLACK_WEBHOOK`
3. 修改workflow添加通知步骤（参见文档）

### 使用环境变量

在workflow中添加：
```yaml
env:
  NODE_ENV: production
  JAVA_OPTS: "-Xmx512m"
```

### 设置并发控制

防止多个部署同时运行：
```yaml
concurrency:
  group: production
  cancel-in-progress: false
```

## 📊 监控和维护

### 定期检查
- [ ] 每周检查GitHub Actions运行情况
- [ ] 每月检查AWS账单
- [ ] 每季度更新依赖
- [ ] 每半年轮换AWS密钥

### 成本监控
- GitHub Actions免费额度: 2000分钟/月（私有仓库）
- 预计每次部署: 15-20分钟
- 每月可免费部署约100次

## ✅ 完成检查清单

部署前确认：

- [ ] GitHub Secrets已配置完成
- [ ] Workflow文件已提交
- [ ] CI测试通过
- [ ] 手动部署测试成功
- [ ] 分支保护规则已设置
- [ ] 团队成员了解工作流程
- [ ] 文档已阅读理解

## 🎉 完成！

现在你已经设置好了完整的CI/CD流程！

**下一步**:
- 开发新功能
- 创建PR
- 让GitHub Actions自动测试和部署

**需要帮助?**
- 查看 [GitHub Actions设置文档](./github-actions-setup.md)
- 查看 [快速参考](./quick-reference.md)
- 查看 [部署笔记](./deployment-notes.md)
