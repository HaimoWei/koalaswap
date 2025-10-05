# 闲鱼爬虫脚本使用指南

## 📋 文件说明

| 文件名 | 用途 | 目标数量 | 预计时间 |
|--------|------|----------|----------|
| `goofish_base.py` | 基础类文件 | - | - |
| `goofish_demo.py` | 测试版本 | 10个商品 | 5-10分钟 |
| `goofish_complete.py` | **🌟 完整挂机版本** | 500个商品 | 3-4小时 |
| `goofish_part1.py` | 第1部分 | 100个商品 | 30-45分钟 |
| `goofish_part2.py` | 第2部分 | 100个商品 | 30-45分钟 |
| `goofish_part3.py` | 第3部分 | 100个商品 | 30-45分钟 |
| `goofish_part4.py` | 第4部分 | 100个商品 | 30-45分钟 |
| `goofish_part5.py` | 第5部分 | 100个商品 | 30-45分钟 |

**总计目标：500个商品 + 200个用户数据**

## 🚀 启动前准备

### 1. 启动Chrome远程调试模式

关闭所有Chrome窗口，然后运行：

```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\temp\chrome_debug"
```

### 2. 登录闲鱼账号

在新启动的Chrome中：
1. 访问 https://www.goofish.com
2. 登录你的闲鱼账号
3. 确保能正常浏览商品

## 🧪 Demo测试（推荐先运行）

### 启动Demo版本

```bash
cd D:\Code\Project\koalaswap
python scripts/goofish_scrapers/goofish_demo.py
```

## 🌟 挂机完整版本（推荐）

### 启动完整挂机爬虫

```bash
cd D:\Code\Project\koalaswap
python scripts/goofish_scrapers/goofish_complete.py
```

**完整版特点：**
- 一次性爬取500个商品
- 包含所有品牌手机和平板
- 适合睡觉时挂机运行
- 自动进度保存和恢复
- 智能休息和错误处理

**Demo特点：**
- 只爬取10个商品
- 运行时间短（5-10分钟）
- 用于验证爬虫功能
- 测试数据质量

**Demo输出文件：**
- `dataset/products_demo.json` - 商品数据
- `dataset/users_demo.json` - 用户数据
- `dataset/images/` - 商品图片
- `dataset/progress_demo_*.json` - 进度文件

## 📦 生产环境运行

### 运行顺序（推荐）

按以下顺序分批运行，每次运行一个脚本：

```bash
# 第1部分：iPhone & 苹果手机
python scripts/goofish_scrapers/goofish_part1.py

# 第2部分：华为 & 小米手机
python scripts/goofish_scrapers/goofish_part2.py

# 第3部分：OPPO & vivo手机
python scripts/goofish_scrapers/goofish_part3.py

# 第4部分：三星 & 游戏手机
python scripts/goofish_scrapers/goofish_part4.py

# 第5部分：平板电脑
python scripts/goofish_scrapers/goofish_part5.py
```

### 各部分爬取内容

| 部分 | 主要关键词 | 商品类型 |
|------|------------|----------|
| Part1 | iPhone手机, 苹果手机, iPhone 13/12/11 | 苹果系列手机 |
| Part2 | 华为手机, 小米手机, 红米手机 | 华为小米系列 |
| Part3 | OPPO手机, vivo手机, 一加手机 | OPPO vivo系列 |
| Part4 | 三星手机, 游戏手机, 黑鲨手机 | 三星游戏手机 |
| Part5 | 平板电脑, iPad, 华为平板 | 平板电脑系列 |

## 📊 输出文件结构

### 生产环境文件

每个部分运行后会生成：

```
dataset/
├── products_part1.json     # 第1部分商品数据
├── products_part2.json     # 第2部分商品数据
├── ...
├── users_part1.json        # 第1部分用户数据
├── users_part2.json        # 第2部分用户数据
├── ...
├── images/                 # 所有商品图片
│   ├── goofish_part1_1_0.jpg
│   ├── goofish_part1_1_1.jpg
│   └── ...
└── progress_part*_*.json   # 进度跟踪文件
```

### 合并数据（可选）

如需合并所有部分的数据，可以手动合并JSON文件或使用数据库导入。

## ⚠️ 注意事项

### 安全使用

1. **延迟设置**：脚本已设置8-15秒随机延迟，请勿修改
2. **批次间隔**：每个关键词间会自动休息
3. **异常处理**：支持Ctrl+C中断，会自动保存进度

### 错误处理

- **连接失败**：检查Chrome远程调试是否启动
- **登录失效**：重新登录闲鱼账号
- **网络错误**：检查网络连接，脚本会自动重试

### 数据质量

- **图片下载**：自动过滤小于1KB的无效图片
- **价格转换**：中文价格自动转换为澳元
- **标题翻译**：中文商品名翻译为英文
- **用户生成**：为每个商品生成对应的澳洲用户数据

## 🔧 故障排除

### 常见问题

1. **无法连接Chrome**
   ```
   解决：重新启动Chrome远程调试模式
   ```

2. **找不到商品**
   ```
   解决：检查闲鱼登录状态，确保能正常浏览
   ```

3. **图片下载失败**
   ```
   解决：检查网络连接，脚本会自动跳过失败的图片
   ```

4. **程序中断**
   ```
   解决：重新运行相同脚本，会从中断处继续
   ```

## 📈 监控进度

### 实时监控

脚本运行时会显示：
- 当前处理的关键词
- 已爬取的商品数量
- 下载的图片数量
- 预计剩余时间

### 进度文件

检查 `dataset/progress_*.json` 文件了解详细进度：

```json
{
  "session_id": "20240922_143022",
  "part_name": "part1",
  "total_products": 45,
  "target_products": 100,
  "completion_rate": 0.45
}
```

## ✅ 完成后验证

### 数据验证

1. 检查商品数据质量
2. 验证图片下载完整性
3. 确认用户数据生成
4. 检查价格和描述翻译

### 清理测试数据

Demo测试完成后，如需清理：

```bash
rm dataset/products_demo.json
rm dataset/users_demo.json
rm dataset/progress_demo_*.json
# 注意：不要删除 dataset/images/ 目录
```

---

**🎯 目标达成：500个真实商品 + 200个用户 + 完整图片库**