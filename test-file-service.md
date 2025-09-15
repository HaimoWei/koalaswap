# File Service 测试指南

## 重构完成总结

### 🎉 已完成的重构内容

1. **✅ 创建了独立的 file-service 微服务**
   - 端口：12647
   - 支持多种文件类型：头像、商品图、聊天图、文档
   - 统一的文件上传接口

2. **✅ 迁移了 AWS S3 配置**
   - 从 product-service 完整迁移
   - 支持环境变量配置
   - 保持与现有配置兼容

3. **✅ 修改了 product-service**
   - 不再直接处理图片上传
   - 通过 FileServiceClient 代理到 file-service
   - 保持现有 API 兼容性

4. **✅ 实现了头像上传功能**
   - 前端：新增 files.ts API 客户端
   - 后端：user-service 添加头像更新接口
   - 完整的上传流程：获取URL → 上传S3 → 更新数据库

## 测试步骤

### 1. 启动服务

```bash
# 1. 启动 file-service
cd D:\Code\Project\koalaswap\backend\file-service
../mvnw spring-boot:run -Dspring-boot.run.profiles=local

# 2. 启动 user-service (需要，用于头像更新)
cd D:\Code\Project\koalaswap\backend\user-service
../mvnw spring-boot:run -Dspring-boot.run.profiles=local

# 3. 启动 product-service (可选，测试商品图片上传)
cd D:\Code\Project\koalaswap\backend\product-service
../mvnw spring-boot:run -Dspring-boot.run.profiles=local

# 4. 启动前端
cd D:\Code\Project\koalaswap\frontend-web
npm run dev
```

### 2. 测试头像上传

1. 打开浏览器：http://localhost:5173
2. 登录账户
3. 进入个人资料页面：/me/center/profile
4. 点击头像，选择图片文件
5. 确认上传成功，头像URL更新

### 3. 测试商品图片上传

1. 登录后进入商品发布页面
2. 上传商品图片
3. 确认图片通过 file-service 上传成功

## API 接口对照

### File Service 新接口

```
POST /api/files/upload-url
POST /api/files/batch-upload-urls
POST /api/files/{category}/upload-url
GET  /health
```

### 原有接口兼容性

```
# Product Service (现在代理到 file-service)
POST /api/images/upload-url
POST /api/images/batch-upload-urls

# User Service (新增)
PUT /api/users/me/avatar
```

## 架构优势

1. **统一管理**：所有文件上传统一在 file-service 处理
2. **易扩展**：支持新的文件类型（聊天图片、文档等）
3. **向后兼容**：原有 API 保持不变
4. **职责分离**：business services 专注业务逻辑

## 下一步扩展

- 聊天图片上传
- 文档上传（身份证明等）
- 图片处理（压缩、水印）
- 文件安全检测

## 故障排除

如果遇到问题：

1. 检查所有服务是否正常启动
2. 检查 AWS 环境变量是否设置
3. 查看各服务日志
4. 确认 Redis 连接正常

恭喜！头像上传功能已经完全从假接口升级为真实的 AWS S3 + 微服务架构！🚀