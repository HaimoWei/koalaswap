# KoalaSwap 文档中心

欢迎查看KoalaSwap项目文档！

## 📚 文档导航

### 快速开始
- **[快速参考卡片](./quick-reference.md)** - 最常用的命令和配置速查表

### 部署相关
- **[部署笔记](./deployment/deployment-notes.md)** - 完整的生产部署流程和配置说明
- **[部署配置](./deployment/deployment-config.md)** - 服务器配置详情
- **[部署指南](./deployment/deployment-guide.md)** - 部署操作指南
- **[部署检查清单](./deployment/DEPLOYMENT_CHECKLIST.md)** - 部署前检查事项
- **[部署总结](./deployment/DEPLOYMENT_SUMMARY.md)** - 部署总结文档

### CI/CD
- **[GitHub Actions设置指南](./ci-cd/github-actions-setup.md)** - 详细的CI/CD配置说明
- **[CI/CD设置检查清单](./ci-cd/CI-CD-SETUP-CHECKLIST.md)** - 一步步设置GitHub Actions

### 开发相关
- **[数据集导入计划](./development/DATASET_IMPORT_PLAN.md)** - 数据集导入说明
- **[API规范](./development/api-spec.md)** - API接口规范
 - **[文案英文化与多语言规划](./development/TRANSLATION_AND_I18N_PLAN.md)** - 将中文文案系统翻译为英文的执行计划

## 🎯 根据场景查找文档

### 我想部署到生产环境
1. 首次部署 → 阅读 [部署笔记](./deployment/deployment-notes.md)
2. 设置自动部署 → 阅读 [CI/CD设置检查清单](./ci-cd/CI-CD-SETUP-CHECKLIST.md)
3. 日常更新 → 查看 [快速参考](./quick-reference.md)

### 我想了解项目架构
- 服务列表和端口 → [快速参考 - 服务列表](./quick-reference.md#-服务列表)
- 域名和URL → [快速参考 - 域名和URL](./quick-reference.md#-域名和url)

### 出现问题需要排查
- 常见问题 → [部署笔记 - 常见问题](./deployment/deployment-notes.md#常见问题)
- 紧急情况处理 → [快速参考 - 紧急情况](./quick-reference.md#-紧急情况)

### 我想贡献代码
1. 了解工作流程 → [GitHub Actions设置 - 分支策略](./ci-cd/github-actions-setup.md#分支策略建议)
2. 开发新功能 → [CI/CD检查清单 - 日常使用](./ci-cd/CI-CD-SETUP-CHECKLIST.md#-日常使用)

## 📖 文档说明

### [quick-reference.md](./quick-reference.md)
**适合**: 经常需要查命令的开发者

**内容**:
- 常用命令速查
- 数据库连接信息
- 服务端口列表
- 紧急情况处理

**适用场景**:
- "怎么查看生产环境日志？"
- "本地数据库密码是什么？"
- "网站打不开了怎么办？"

### [deployment/deployment-notes.md](./deployment/deployment-notes.md)
**适合**: 负责部署的开发者

**内容**:
- 完整部署流程
- 数据迁移步骤
- 配置文件说明
- 监控和维护

**适用场景**:
- 首次部署到生产环境
- 需要迁移数据
- 更新部署配置

### [ci-cd/github-actions-setup.md](./ci-cd/github-actions-setup.md)
**适合**: DevOps和CI/CD负责人

**内容**:
- GitHub Actions详细配置
- Workflow工作原理
- 分支策略建议
- 安全最佳实践

**适用场景**:
- 设置自动化部署
- 理解CI/CD流程
- 优化部署效率

### [ci-cd/CI-CD-SETUP-CHECKLIST.md](./ci-cd/CI-CD-SETUP-CHECKLIST.md)
**适合**: 第一次设置CI/CD的开发者

**内容**:
- 分步骤设置指南
- 检查清单
- 故障排查
- 测试验证

**适用场景**:
- "我该怎么设置GitHub Actions？"
- "怎么测试CI/CD是否正常工作？"
- "部署失败了怎么办？"

## 🔗 外部资源

- [GitHub仓库](https://github.com/yourusername/koalaswap)
- [生产环境](https://koalaswap.lightspot.uk)
- [API文档](https://api.koalaswap.lightspot.uk/swagger-ui.html)

## 🆘 获取帮助

如果文档没有解决你的问题：

1. **检查日志**
   ```bash
   # 本地
   docker compose logs -f

   # 生产
   ssh -i koalaswap-ec2.pem ubuntu@<your-ec2-ip>
   cd /opt/koalaswap
   docker compose -f docker-compose.prod.yml logs -f
   ```

2. **联系团队**
   - 邮箱: weihaimoau@gmail.com

3. **查看GitHub Issues**
   - 搜索相似问题
   - 创建新issue

## 📝 维护文档

文档需要保持更新。如果发现：
- 命令不正确
- 配置已过时
- 流程有变化
- 缺少重要信息

请更新相应文档并提交PR！

## 🎓 推荐阅读顺序

### 新手开发者
1. [快速参考](./quick-reference.md) - 了解基本概念
2. [CI/CD检查清单](./ci-cd/CI-CD-SETUP-CHECKLIST.md) - 设置开发环境
3. [GitHub Actions设置](./ci-cd/github-actions-setup.md) - 理解工作流程

### 运维人员
1. [部署笔记](./deployment/deployment-notes.md) - 了解部署架构
2. [快速参考](./quick-reference.md) - 记住常用命令
3. [GitHub Actions设置](./ci-cd/github-actions-setup.md) - 优化部署流程

### 项目负责人
1. [部署笔记](./deployment/deployment-notes.md) - 了解整体架构
2. [GitHub Actions设置](./ci-cd/github-actions-setup.md) - 理解CI/CD
3. [部署配置](./deployment/deployment-config.md) - 掌握配置细节

---

**最后更新**: 2025-10-06
**维护者**: KoalaSwap Team
