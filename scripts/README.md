# Scripts 目录说明

## 📁 目录结构

```
scripts/
├── README.md                   # 本文件
├── dataset_import/             # 种子数据导入系统
│   ├── main.py                 # 主入口文件
│   ├── config.py               # 配置文件
│   ├── api.py                  # API客户端
│   ├── import_users.py         # 用户导入
│   ├── import_products.py      # 产品导入
│   ├── upload_images_db.py     # 图片上传关联
│   ├── preparer.py             # 数据准备
│   ├── validate_dataset.py     # 数据集验证
│   ├── fix_dataset.py          # 数据集修复
│   ├── check_database_compatibility.py  # 数据库兼容性检查
│   └── ...                     # 其他工具脚本
├── goofish_scrapers/           # 闲鱼爬虫系统
│   ├── README.md               # 爬虫详细使用说明
│   ├── goofish_base.py         # 基础类文件
│   ├── goofish_complete.py     # 完整版爬虫
│   ├── goofish_supplement.py   # 补充数据爬虫
│   ├── goofish_demo.py         # Demo测试版本 (10个商品)
│   ├── goofish_part1.py        # 第1部分 (iPhone & 苹果)
│   ├── goofish_part2.py        # 第2部分 (华为 & 小米)
│   ├── goofish_part3.py        # 第3部分 (OPPO & vivo)
│   ├── goofish_part4.py        # 第4部分 (三星 & 游戏手机)
│   └── goofish_part5.py        # 第5部分 (平板电脑)
├── upload_images_db.py         # 独立的图片上传工具 (用于已存在的产品)
└── run-backend-local.sh        # 后端启动脚本
```

## 🚀 快速开始

### 种子数据导入系统

```bash
cd scripts/dataset_import

# 完整导入流程
python main.py prepare     # 准备数据集
python main.py import      # 导入用户和产品
python upload_images_db.py # 上传并关联图片

# 单独操作
python import_users.py     # 仅导入用户
python import_products.py  # 仅导入产品
python validate_dataset.py # 验证数据集
```

### 使用闲鱼爬虫

```bash
# 查看详细说明
cat scripts/goofish_scrapers/README.md

# 运行Demo测试
python scripts/goofish_scrapers/goofish_demo.py

# 运行完整爬虫
python scripts/goofish_scrapers/goofish_complete.py
```

### 独立图片上传工具

```bash
# 为数据库中已存在的产品批量上传图片
python scripts/upload_images_db.py
```

### 其他脚本

- **后端启动**: `./scripts/run-backend-local.sh`

---

**📖 详细使用说明请查看各子目录的README文件**