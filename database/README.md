# 🐨 KoalaSwap 数据库说明

## 📌 基本信息

- **类型**：PostgreSQL ≥ 13  
- **服务端口**：`6432`（默认 `5432` 被本地 PG 占用，故使用替代端口）  
- **默认数据库**：`koalaswap_dev`  
- **默认用户**：`koalaswap`  
- **Docker 配置**：参见 [`infra/docker-compose.yml`](../infra/docker-compose.yml)

## 🏗 数据结构（Schema）

所有核心表结构定义在 [`database/schema.sql`](./schema.sql)，包含：

| 模块       | 表名                         | 说明                  |
|------------|------------------------------|-----------------------|
| 用户系统   | `users`                      | 用户基础信息          |
| 商品系统   | `products`、`product_images` | 商品详情与图片        |
| 分类系统   | `product_categories`         | 支持父子分类结构      |
| 收藏功能   | `favourites`                 | 用户收藏商品          |
| 交易系统   | `orders`、`order_reviews`    | 支付与评论            |
| 聊天系统   | `conversations`、`messages`、`conversation_participants` | 支持多人群聊 |

## 🔑 主键 UUID 支持

所有主键字段均使用 `UUID` 类型，并通过 PostgreSQL 内置扩展 `pgcrypto` 自动生成：

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

无需手动传入 UUID，PostgreSQL 自动生成唯一主键。

## 🌱 种子数据（Seed）

开发环境可使用 [`database/seed.sql`](./seed.sql) 快速插入演示数据，包含：

- 3 名用户（含密码加密）
- 多个商品与图片
- 收藏、订单与评论
- 聊天记录（会话 + 成员 + 消息）

执行方式：

```bash
psql -h localhost -p 6432 -U koalaswap -d koalaswap_dev -f database/seed.sql
```

> ⚠️ 已加入 `TRUNCATE` 清空逻辑，执行前请确保不影响生产数据。

## 📊 ER 图（数据关系图）

可在 [dbdiagram.io](https://dbdiagram.io/d/koalaswap-689485ebdd90d17865e55169) 在线查看本项目的数据库 ER 图：  
👉 https://dbdiagram.io/d/koalaswap-689485ebdd90d17865e55169

## ✅ 注意事项

- 本地数据库端口为 `6432`，请确保未被其他服务占用。
- 所有数据表均已添加外键约束，删除时注意级联行为（如 `ON DELETE CASCADE`）。
- 支持全文搜索（`tsvector` + GIN index）与评分自动计算（触发器）。
- 数据卷定义为 `koalaswap-db-data`，容器重启后数据不会丢失。
