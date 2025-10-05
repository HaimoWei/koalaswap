# KoalaSwap Dataset 导入施工方案

## 📋 项目概述
将抓取的商品和用户数据通过真实API接口导入到KoalaSwap系统，确保S3图片上传和数据完整性。

## 🗂️ 数据现状分析

### 原始数据文件
```
dataset/
├── users_complete.json               # 完整用户数据 (268 条，含 first/last_name)
├── users_complete_fixed.json         # 完整用户数据修订版 (268 条)
├── users_supplement.json             # 补充用户数据 (286 条，无 first/last_name)
├── products_complete.json            # 商品数据 (799 条)
├── products_supplement.json          # 补充商品数据 (991 条)
├── progress_complete_*.json          # 抓取进度快照
├── progress_supplement_*.json        # 抓取进度快照
├── images/                           # 商品图片文件夹
│   ├── goofish_complete_1_0.jpg
│   ├── goofish_complete_2_0.jpg
│   └── ...
└── backup/20250922_130605/           # 原始数据备份
```

### 数据结构映射关系

> 本计划的前提：**不调整数据库 Schema**。所有种子数据必须在导入前完成清洗与转换，以匹配既有字段和约束。

#### 用户数据映射
| Dataset字段 | API/DB字段 | 转换规则                            | 备注 |
|-------------|-------------|---------------------------------|------|
| `email` | `email` (注册 API) | 直接使用                            | 必须唯一 |
| `display_name` | `displayName` (注册 API) | 直接使用                            | 作为用户可见昵称 |
| - | `password` (注册 API) | 统一生成强密码（默认 `weihaimo`），并保存种子清单  | 首次登录需改密 |
| `phone_verified` | `phone_verified` (DB) | 导入后批量 `UPDATE`                  | API 不暴露该字段 |
| `email_verified` | `email_verified` (DB) | 导入后批量 `UPDATE`                  | 统一设为 `true` |
| `rating_avg`/`rating_count` | `rating_avg` / `rating_count` (DB) | 导入后批量 `UPDATE`                  | 同步真实评分 |
| `member_since` | `member_since` (DB) | 导入后批量 `UPDATE`                  | 类型为 `DATE` |
| `username` | - | 写入 `seed_user_metadata.json` 备用 | 当前 schema 无列 |
| `first_name`/`last_name` | - | 写入 `seed_user_metadata.json` 备用 | 可供未来扩展 |

#### 商品数据映射
| Dataset字段 | API/DB字段 | 转换规则 | 备注 |
|-------------|-------------|----------|------|
| `title` | `title` (创建商品 API) | 直接使用 | 清洗特殊字符 |
| `description` | `description` | 直接使用 | 保持原值 |
| `price` & `original_text` | `price` (API) | 优先解析 `original_text` 中的 `¥` 金额 → 按固定汇率 `CNY / 4.7` 转 AUD，再保留两位小数；若无法解析则使用 `price / 100` | 确保非负、`NUMERIC(10,2)` |
| `currency` | `currency` | 固定写 `AUD` | 统一货币 |
| `condition` | `condition` | 映射：`EXCELLENT→LIKE_NEW`、其余直接取值并校验在 ENUM (`NEW/LIKE_NEW/GOOD/FAIR/POOR`) 中 | 避免违反约束 |
| `category` | `categoryId` | 依据映射表 `category_mapping.json`（含默认分类 1011） | 标题关键词匹配 |
| `seller_id` | 生成/匹配用户 | 若 ID 已导入则直接使用；否则生成占位卖家（自动注册账号，记录于 `seed_seller_mapping.json`） | 保证外键存在 |
| `images` | 图片上传 API | 本地文件 → S3 预签名上传；同步 `is_primary`、`display_order`、`upload_status='COMPLETED'` | 脚本支持多图，但当前数据每个商品只有 1 张 |
| - | `freeShipping` | 脚本按 70% 概率随机生成 `true`，其余为 `false` | 保留抓取数据的多样性 |

### 数据清洗前置任务

1. **校验原始计数**：结合 `progress_complete_*.json` 与 `progress_supplement_*.json`，确认待导入的用户/商品数量，并在脚本中常量化，防止重复导入。
2. **构建映射文件**：生成 `category_mapping.json`、`seed_seller_mapping.json`、`seed_user_metadata.json`，并加入 CI 校验，确保脚本运行前可用。
3. **价格与状态校验**：使用 `scripts/dataset_import/normalizers.py` 中的工具逻辑（`prepare` 命令会自动调用），对所有商品做预扫描，输出异常明细（价格缺失、枚举不匹配等）。
4. **图片完整性检查**：对 `dataset/images` 与商品 JSON 做一次一致性校验，生成报告后才进入导入阶段。

## 🛠️ 技术实现方案

### 核心API接口
1. **用户注册**: `POST /api/auth/register`
2. **用户登录**: `POST /api/auth/login`
3. **创建商品**: `POST /api/products`
4. **图片上传**: `POST /api/products/images/request-upload`
5. **完成上传**: `POST /api/products/images/upload-complete`

### 数据流程设计
```
1. 读取用户数据 → 调用注册API → 保存用户映射
2. 逐个登录用户 → 获取JWT Token → 创建商品
3. 创建商品成功 → 上传图片到S3 → 更新图片记录
4. 记录导入日志 → 验证数据完整性
```

## 📝 具体施工步骤

### 阶段一：环境准备 (预计30分钟)

#### Step 1.1: 检查系统环境
```bash
# 检查Python环境
python3 --version  # 需要 >= 3.8

# 安装依赖（建议使用虚拟环境）
pip3 install -r scripts/dataset_import/requirements.txt

# 检查AWS配置
aws configure list
echo $AWS_ACCESS_KEY_ID
echo $S3_BUCKET
```

#### Step 1.2: 启动本地服务
```bash
# 启动数据库
cd infra && docker-compose up -d postgres

# 启动后端服务
cd backend
./mvnw clean install
./mvnw spring-boot:run -Dspring.profiles.active=local

# 验证服务可用性
curl http://localhost:8080/api/health
```

#### Step 1.3: 验证数据库初始状态
```bash
# 连接数据库检查分类数据
psql -h localhost -U koalaswap_user -d koalaswap_db -c "SELECT * FROM product_categories WHERE id = 1011;"

# 验证应返回: (1011, '智能手机', 1001)
```

### 阶段二：创建导入脚本 (预计45分钟)

#### Step 2.1: 创建脚本目录和文件
```bash
mkdir -p scripts/dataset_import
cd scripts/dataset_import

# 创建以下文件:
# - config.py                 # 配置文件
# - utils.py                  # 日志与通用函数
# - normalizers.py            # 价格/状态/分类等清洗逻辑
# - metadata_store.py         # 用户/卖家/分类映射的读写
# - import_users.py           # 用户导入脚本
# - import_products.py        # 商品导入脚本
# - upload_images.py          # 图片上传脚本
# - demo_import.py            # 小批量演示脚本
# - main.py                   # 全量执行入口
```

> 依赖文件集中在 `scripts/dataset_import/requirements.txt`，方便虚拟环境安装。

#### Step 2.2: 核心脚本结构

**config.py** – 统一配置
```python
import os
from dataclasses import dataclass

@dataclass
class Config:
    base_url: str = "http://localhost:8080"
    dataset_path: str = "../../dataset"
    default_password: str = "weihaimo"
    demo_user_limit: int = 5
    demo_product_limit: int = 10
    category_mapping_path: str = "category_mapping.json"
    seller_mapping_path: str = "seed_seller_mapping.json"
    user_metadata_path: str = "seed_user_metadata.json"
    aws_s3_bucket: str = os.getenv("S3_BUCKET", "koalaswap-seed")
    price_exchange_rate: float = 4.7

    def dataset_file(self, name: str) -> str:
        return os.path.join(self.dataset_path, name)
```

**normalizers.py** – 价格 / 状态 / 分类等清洗逻辑
```python
from decimal import Decimal

ALLOWED_CONDITIONS = {"NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"}
CONDITION_ALIAS = {"EXCELLENT": "LIKE_NEW"}

def normalize_condition(raw: str) -> str:
    value = CONDITION_ALIAS.get(raw.upper(), raw.upper())
    if value not in ALLOWED_CONDITIONS:
        raise ValueError(f"unsupported condition: {raw}")
    return value

def normalize_price(raw_price: int, original_text: str, exchange_rate: float) -> Decimal:
    amount_cny = parse_price_from_text(original_text)
    if amount_cny:
        aud = Decimal(amount_cny) / Decimal(exchange_rate)
    else:
        aud = Decimal(raw_price) / Decimal(100)
    if aud <= 0:
        raise ValueError("price must be positive")
    return aud.quantize(Decimal("0.01"))
```

> `parse_price_from_text` 建议放在 `normalizers.py` 中，使用正则匹配 `¥` 或数字，必要时结合标题关键词进行校正。

**metadata_store.py** – 存储元数据与占位卖家账号
```python
import json
from pathlib import Path

class MetadataStore:
    def __init__(self, config):
        self.config = config

    def load_categories(self):
        with open(self.config.category_mapping_path, encoding="utf-8") as f:
            return json.load(f)

    def ensure_seller(self, seller_id, user_service):
        mapping = self._load_sellers()
        if seller_id in mapping:
            return mapping[seller_id]
        account = user_service.create_placeholder_seller(seller_id)
        mapping[seller_id] = account
        self._save_sellers(mapping)
        return account

    def _load_sellers(self):
        path = Path(self.config.seller_mapping_path)
        return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}

    def _save_sellers(self, mapping):
        Path(self.config.seller_mapping_path).write_text(
            json.dumps(mapping, ensure_ascii=False, indent=2), encoding="utf-8"
        )
```

**utils.py** – 日志、HTTP 客户端、断点续传管理，补充数据校验和进度快照功能。

**demo_import.py** – 小批量导入演示，验证脚本与环境
```python
from config import Config
from import_users import UserImporter
from import_products import ProductImporter

def run():
    cfg = Config()
    users = UserImporter(cfg)
    user_ids = users.import_batch(limit=cfg.demo_user_limit)

    products = ProductImporter(cfg)
    products.import_batch(user_ids=user_ids, limit=cfg.demo_product_limit)

if __name__ == "__main__":
    run()
```

**main.py** – 顺序执行：预清洗 → 用户导入 → 卖家占位补齐 → 商品导入 → 图片上传 → DB 字段补写。

### 阶段三：执行数据导入 (预计45分钟)

#### Step 3.0: 种子快照生成
```bash
python3 scripts/dataset_import/main.py prepare --dataset-part complete --random-seed 20250922

# 预期结果:
# ✅ output/summary.json 统计用户 / 商品 / 占位卖家数量
# ✅ output/user_seed_snapshot.json、seed_user_metadata.json、seed_seller_mapping.json、product_seed_snapshot.json 等文件就绪
```

#### Step 3.1: Demo 演练
```bash
python3 scripts/dataset_import/main.py demo --user-limit 5 --product-limit 10

# 预期结果:
# ✅ 生成 demo_seed_report.json，展示前 5 个用户与前 10 个商品
# ✅ summary.json 更新为最新准备结果
```

#### Step 3.2: 用户数据导入
```bash
# 执行用户导入（默认仅主用户，可按需加入占位卖家）
python3 scripts/dataset_import/main.py import-users --include-placeholders --execute

# 预期结果:
# ✅ 注册 268 个主用户 + 约 531 个 seed-seller 占位账号
# ✅ API 返回的 userId 与 user_seed_snapshot.json 匹配
```

#### Step 3.3: 商品数据导入
```bash
python3 scripts/dataset_import/main.py import-products --execute

# 预期结果:
# ✅ 新建 799 个商品（products_complete.json）
# ✅ 卖家登录使用默认密码 `weihaimo`
# ✅ 生成 product_import_results.json（dataset → 实际产品ID映射）
```

#### Step 3.4: 图片数据上传
```bash
python3 scripts/dataset_import/main.py upload-images --execute

# 预期结果:
# ✅ 上传 799 张主图（每个商品 1 张，保留多图能力），使用 API 的 request-upload + upload-complete 流程
# ✅ 数据库 product_images 表的记录状态更新为 `COMPLETED`
```

> 如需导入补充集（supplement），在完成 `complete` 部分后，重复 Step 3.0 ~ Step 3.4，并在 `prepare` 命令中传入 `--include-supplement --dataset-part supplement`，同时更新校验脚本中的预期数量。

### 阶段四：数据验证 (预计15分钟)

#### Step 4.1: 数据库完整性检查
```sql
-- 主数据用户数量（邮箱来自原始数据）
SELECT COUNT(*)
FROM users
WHERE email LIKE '%@%'
  AND email NOT LIKE 'seed-seller+%@%';  -- 期望 = 268（或 268 + 补充集数量）

-- 占位卖家数量（脚本统一生成 seed-seller 前缀）
SELECT COUNT(*)
FROM users
WHERE email LIKE 'seed-seller+%@%';  -- 期望 ≈ 531

-- 商品数量（使用导入快照中的 UUID 列表核对）
SELECT COUNT(*)
FROM products
WHERE id = ANY(:product_id_array_from_snapshot);  -- 期望 = 799

-- 图片数量
SELECT COUNT(*)
FROM product_images
WHERE product_id = ANY(:product_id_array_from_snapshot)
  AND upload_status = 'COMPLETED';  -- 期望 = 799

-- 外键关系校验
SELECT COUNT(*)
FROM products p
JOIN users u ON p.seller_id = u.id
WHERE p.id = ANY(:product_id_array_from_snapshot);  -- 期望 = 799
```

> `:product_id_array_from_snapshot` 可通过读取 `product_seed_snapshot.json` 转换为 `ARRAY['uuid1','uuid2',...]` 后在 psql 中使用 `\set product_ids ...` 引入。

#### Step 4.2: S3存储验证
```bash
# 检查S3存储
aws s3 ls s3://$S3_BUCKET/products/images/seed_complete/ --recursive | wc -l
# 期望 ≈ 799 个图片文件

# 抽样检查图片URL可访问性
curl -I "https://$CDN_BASE/products/images/seed_complete/<object-key>"
# 应返回 200 OK
```

#### Step 4.3: API功能验证
```bash
# 测试商品列表API
curl "http://localhost:8080/api/products?page=0&size=10"

# 测试商品详情API
curl "http://localhost:8080/api/products/{product_id}"

# 验证图片显示正常
```

### 阶段五：生产部署准备 (预计30分钟)

#### Step 5.1: 数据备份
```bash
# 备份本地数据库
pg_dump -h localhost -U koalaswap_user koalaswap_db > dataset_import_backup_$(date +%Y%m%d_%H%M%S).sql

# 压缩备份文件
gzip dataset_import_backup_*.sql
```

#### Step 5.2: 环境配置检查
```bash
# 检查生产环境配置
cat backend/*/src/main/resources/application-prod.yml

# 确认AWS生产配置
echo $CDN_BASE  # CloudFront域名
echo $S3_BUCKET # 生产S3桶
```

#### Step 5.3: 部署策略确认
```bash
# 选择部署方式:
# 方案A: 直接部署到生产 (数据已准备好)
# 方案B: 生产环境重新导入 (需要传输dataset文件)

# 推荐: 方案A - 本地数据迁移到生产
```

#### Step 5.4: 种子包归档
```bash
# 打包导入使用的核心文件，便于审计与复现
tar czf koalaswap_seed_bundle_$(date +%Y%m%d).tar.gz \
  dataset/products_complete.json \
  dataset/users_complete.json \
  dataset/images \
  scripts/dataset_import/*.py \
  scripts/dataset_import/output/seed_seller_mapping.json \
  scripts/dataset_import/output/seed_user_metadata.json \
  scripts/dataset_import/output/product_seed_snapshot.json \
  scripts/dataset_import/output/product_import_results.json
```

## ⚠️ 注意事项和风险控制

### 数据安全
- ✅ 原始数据已备份到 `dataset/backup/`
- ✅ 默认密码设为 `weihaimo`（首次登录强制改密流程待验证）
- ✅ 全流程使用现有 API 与 schema，所有清洗逻辑在脚本层完成

### 性能考虑
- 📊 预计导入时间: 2小时内完成
- 🔄 支持中断续传 (通过映射文件记录进度)
- 📈 批量处理 (每批50条数据)

### 错误处理
- 🔁 API调用失败自动重试 (最多3次)
- 📝 详细日志记录每个操作
- ⏸️ 支持断点续传

### 回滚方案
```bash
# 回滚流程（建议导入前演练一次）
# 1. 停止相关服务，确保无人写入
# 2. psql 恢复 Step 5.1 生成的备份：
#    psql -h ... -U ... -d koalaswap_db < backup.sql
# 3. 读取 product_seed_snapshot.json，批量删除 S3 对象：
#    aws s3 rm s3://$S3_BUCKET --recursive --exclude "*" --include "products/images/seed_complete/*"
# 4. 清理本地缓存与 mapping 文件（seed_seller_mapping.json 等）
# 5. 重新执行 python3 scripts/dataset_import/main.py demo 验证环境，再重跑全量导入
```

## 📊 预期成果

### 导入完成后状态
- ✅ **用户**: 268 个核心账号 + 约 531 个 seed-seller 占位账号，均启用默认密码
- ✅ **商品**: 799 个智能手机商品（可根据补充集扩展）
- ✅ **图片**: 799 张主图上传完成，S3 与数据库一致
- ✅ **数据**: 外键完整，`condition` 已映射到合法枚举

### 系统功能验证
- 🔍 商品搜索和筛选正常
- 🖼️ 图片显示和CDN加速正常
- 👤 用户登录和权限控制正常
- 🛒 商品收藏和交易流程正常

---

## 🚀 开始执行

**准备就绪后，请按以下顺序执行:**

1. ⚡ **环境检查**: `./scripts/check_environment.sh`
2. 🔧 **创建脚本**: 根据上述框架编写具体实现
3. 🧪 **运行 Demo**: `python3 scripts/dataset_import/demo_import.py`
4. 📊 **执行全量导入**: `python3 scripts/dataset_import/main.py`
5. ✅ **验证结果**: 执行数据库/S3/API 校验脚本
6. 🚀 **生产部署**: 备份数据后部署到生产环境

---

**修改建议：请在此文档基础上调整具体参数、时间安排和执行细节，然后我们开始具体实施！**
