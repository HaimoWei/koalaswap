# 🐨 KoalaSwap

一个模块化、基于 Spring Boot 的二手交易平台。项目拆分为多个小服务，并提供共享的 `common` 库，以确保**认证、安全与异常处理**在各服务间保持一致。

本 README 既有**宏观概览**（KoalaSwap 做什么），也有**微观技术细节**（怎么做、关键技术点、如何本地跑起来）。

---

## ✨ 亮点功能

- **用户与认证**：注册、登录、邮箱验证、忘记密码/重置密码。
- **商品发布**：带图片、分类、定价、成色与上架状态。
- **交易要素**：收藏、下单、评价、会话与消息。
- **安全体系**：无状态 JWT（HS256） + **全局 Token Freshness**（登出/改密后旧 Token 立即失效）。
- **一致的 API 体验**：统一 `ApiResponse<T>` 包装 + 全局异常映射，前端拿来即用。

---

## 🏗️ 架构与技术栈

- **语言/运行时**：Java 21  
- **框架**：Spring Boot 3.3、Spring Web、Spring Security 6、Spring Data JPA（Hibernate 6.5）  
- **数据库**：PostgreSQL 15（Docker Compose 管理），SQL-first（建表脚本 + 种子数据）  
- **认证**：JJWT（HS256）  
- **缓存**：Caffeine（可选，用于 token-version 查询短缓存；生产建议不缓存以确保“立即失效”）  
- **邮件**：SMTP（如 Gmail）  
- **构建**：Maven

### 📦 模块目录

```
backend/
  common/               # 共享 DTO、安全组件、过滤器、异常处理（全服务复用）
  user-service/         # 注册/登录/邮箱验证/忘记密码；token-version 的“权威来源”
  product-service/      # 商品 CRUD、图片、收藏（需 JWT）
database/
  01_schema.sql         # 数据库结构（与当前代码足够匹配）
  02_seed.sql           # 演示用种子数据
infra/
  docker-compose.yml    # Postgres 一键启动 + 自动初始化 schema/seed
```

---

## 🔐 安全模型（为什么稳）

### JWT（HS256）
- `sub`：用户 ID（UUID）  
- `email`：便利字段  
- `pv`：**token 版本号**（token freshness 的关键）  
- `iat` / `exp`：签发/过期时间  
- **时钟偏移**：推荐 **0s**（严格）、也可给 30–60s 容忍；为实现“立即失效”，建议保持 0。

### 全局 Token Freshness（跨服务即时失效）
- `users` 表包含 `token_version`（初始 1）。
- **一旦登出或修改密码**：将 `token_version` +1（或置为更大值）。
- 所有服务都挂载 `TokenFreshnessFilter`：
  1. 解析 JWT，读取 `pv`；
  2. 通过 `TokenVersionProvider` 请求 **user-service 内部接口** 获取**当前版本**：  
     `GET /api/internal/users/{id}/token-version`
  3. 若 `pv < current` → 清空认证 → 返回 **401**。

默认实现通过 HTTP 请求 user-service。为了“立即失效”，建议**不缓存**（或设置极短缓存）。这样无状态、易水平扩展，又能全局及时撤销。

---

## 🐘 数据库设计（PostgreSQL）

**核心表**
- `users`：用户资料 + `token_version` / `password_updated_at` + 评分统计 + 创建/更新时间。
- `email_verification_tokens`：邮箱验证（沿用老表名/字段，便于兼容；存明文 token）。
- `password_reset_tokens`：**安全重置**（仅存 `token_hash` 的 SHA-256 摘要，不落明文）。
- `product_categories`、`products`、`product_images`、`favourites`  
- `orders`、`order_reviews`  
- `conversations`、`conversation_participants`、`messages`

**触发器/函数**
- `fn_touch_updated_at` + 各表 `trg_touch_*`：自动维护 `updated_at`。  
- `fn_bump_token_version_on_password`：当 `password_hash` 变更 → 更新 `password_updated_at` 并**自增** `token_version`。  
- `products` 全文搜索向量 + GIN 索引。  
- 写评价后自动回填被评用户的评分均值与次数。

---

## 🧪 本地运行

### 1) 启动 PostgreSQL（自动建表并灌入演示数据）
```bash
cd infra
docker compose down -v
docker compose up -d db
docker logs -f koalaswap-pg   # 观察 schema 与 seed 执行完成
```

Compose 会挂载：
- `database/01_schema.sql` → 初始化结构
- `database/02_seed.sql` → 初始化数据

### 2) 启动各服务（建议分两个终端）

**user-service**
```bash
cd backend
./mvnw -pl user-service spring-boot:run -Dspring-boot.run.profiles=local
```
**product-service**
```bash
cd backend
./mvnw -pl product-service spring-boot:run -Dspring-boot.run.profiles=local
```

**默认端口**
- user-service：`12649`  
- product-service：`12648`  
- Postgres：`localhost:15433`（库名：`koalaswap_dev`）

---

## 🔗 API 快速总览

### 认证（user-service，`/api/auth`）
- `POST /register`  
- `GET /verify?token=...`  
- `POST /login`  
- `POST /resend?email=...`  
- `POST /forgot-password`  
- `GET /reset-password/validate?token=...`  
- `POST /reset-password`  
- `POST /logout`  

### 内部接口（user-service，`/api/internal`）
- `GET /users/{id}/token-version`  

### 商品（product-service，`/api/products`）
- `POST /`（需要 JWT）  

---

## 🧰 统一返回与错误处理

所有控制器统一返回 `ApiResponse<T>`：

```json
{ "ok": true, "data": { ... } }
{ "ok": false, "message": "ACCOUNT_OR_PASSWORD_INVALID" }
```

---

## 🌱 演示数据

演示账号（密码统一 **`password`**）：
- `alice@example.com`
- `bob@example.com`
- `carol@example.com`
- `dave@example.com`
- `erin@example.com`

---

## 🧭 开发提示

- 服务**无状态**，易水平扩展  
- 邮箱验证表沿用**老表名/字段**  
- 密码重置仅存哈希（更安全）  

---

## 🗺️ Roadmap

- 搜索/筛选 API  
- 媒体存储（S3/GCS）  
- 通知（邮件 + 推送）  
- 可观测性（日志、链路追踪）  
- 数据库迁移工具（Flyway/Liquibase）  

---

## 🤝 贡献

欢迎 PR！

---

## 📄 许可证

MIT
