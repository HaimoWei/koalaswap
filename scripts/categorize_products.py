#!/usr/bin/env python3
"""
商品智能分类脚本
根据商品标题和描述自动分配到正确的产品分类
"""

import re
import psycopg2
from typing import Dict, List, Tuple, Optional

# 数据库配置
DB_CONFIG = {
    'host': 'localhost',
    'port': 15433,
    'database': 'koalaswap_dev',
    'user': 'koalaswap',
    'password': 'secret'
}

# 分类关键词映射
CATEGORY_KEYWORDS = {
    # 数码电子类
    1011: {  # 智能手机
        'keywords': ['iphone', 'iPhone', '苹果手机', '华为手机', '小米手机', '手机', 'vivo', 'oppo', '三星手机', '手机壳', '充电器'],
        'exclusions': ['手机支架', '手机贴膜']
    },
    1023: {  # 平板电脑
        'keywords': ['iPad', 'ipad', '平板', '平板电脑'],
        'exclusions': []
    },
    1021: {  # 笔记本电脑
        'keywords': ['笔记本', '笔记本电脑', 'MacBook', 'macbook', '联想', '戴尔', '华硕', '惠普'],
        'exclusions': []
    },
    1033: {  # 耳机音响
        'keywords': ['耳机', '音响', 'AirPods', 'airpods', '蓝牙耳机', '音箱'],
        'exclusions': []
    },
    1034: {  # 智能手表
        'keywords': ['Apple Watch', 'apple watch', '智能手表', '手表', '华为手表', '小米手表'],
        'exclusions': []
    },
    1031: {  # 数码相机
        'keywords': ['相机', '单反', '微单', '佳能', '尼康', '索尼相机'],
        'exclusions': []
    },

    # 生活用品类
    2021: {  # 护肤品
        'keywords': ['护肤', '面霜', '精华', '爽肤水', '洗面奶', '防晒霜', '面膜', '护肤品'],
        'exclusions': []
    },
    2022: {  # 彩妆
        'keywords': ['彩妆', '口红', '眼影', '粉底', '腮红', '睫毛膏', '眉笔', '化妆品', '美妆', '唇膏', '唇彩', '眼线', '粉饼', '遮瑕'],
        'exclusions': []
    },
    2023: {  # 香水
        'keywords': ['香水', '香氛', '古龙水'],
        'exclusions': []
    },
    2015: {  # 女鞋
        'keywords': ['靴子', '长靴', '短靴', '马丁靴', '高跟鞋', '平底鞋', '运动鞋', '凉鞋', '拖鞋', '女鞋', '高筒靴', '长筒靴', '骑士靴'],
        'exclusions': ['男鞋', '童鞋']
    },
    2014: {  # 男鞋
        'keywords': ['男鞋', '皮鞋', '休闲鞋', '商务鞋'],
        'exclusions': ['女鞋']
    },
    2012: {  # 女装
        'keywords': ['连衣裙', '裙子', '女装', '衬衫', '针织衫', '外套', '大衣', '羽绒服'],
        'exclusions': ['男装', '童装']
    },
    2011: {  # 男装
        'keywords': ['男装', 'T恤', '衬衫', '夹克', '西装'],
        'exclusions': ['女装', '童装']
    },
    2016: {  # 箱包
        'keywords': ['包包', '手提包', '背包', '钱包', '行李箱', '双肩包', '单肩包'],
        'exclusions': []
    },
    2017: {  # 配饰
        'keywords': ['项链', '耳环', '手镯', '戒指', '首饰', '配饰', '丝巾'],
        'exclusions': []
    },

    # 家居生活
    2033: {  # 厨房用品
        'keywords': ['锅', '刀具', '餐具', '厨具', '保温杯', '水杯'],
        'exclusions': []
    },
    2031: {  # 家具
        'keywords': ['椅子', '桌子', '沙发', '床', '柜子', '家具'],
        'exclusions': []
    },
    2032: {  # 家纺用品
        'keywords': ['床单', '被套', '枕头', '毛巾', '浴巾', '家纺'],
        'exclusions': []
    },

    # 图书文娱
    3011: {  # 小说文学
        'keywords': ['小说', '文学', '书籍', '图书'],
        'exclusions': ['教材', '考试']
    },
    3012: {  # 教育考试
        'keywords': ['教材', '考试', '教辅', '习题', '参考书'],
        'exclusions': []
    },
    3021: {  # 文具用品
        'keywords': ['笔', '本子', '文具', '笔记本', '橡皮', '尺子'],
        'exclusions': ['笔记本电脑']
    },

    # 运动户外
    2041: {  # 健身器材
        'keywords': ['哑铃', '健身', '瑜伽垫', '跑步机', '健身器材'],
        'exclusions': []
    },
    2044: {  # 运动鞋
        'keywords': ['跑步鞋', '篮球鞋', '足球鞋', '运动鞋'],
        'exclusions': []
    }
}

class ProductCategorizer:
    def __init__(self):
        self.conn = psycopg2.connect(**DB_CONFIG)
        self.cursor = self.conn.cursor()

    def get_uncategorized_products(self) -> List[Tuple[str, str, str, int]]:
        """获取需要重新分类的商品（排除明显是测试数据的商品）"""
        self.cursor.execute("""
            SELECT id, title, description, category_id
            FROM products
            WHERE title NOT LIKE '%test%'
            AND title NOT LIKE '%Test%'
            AND title NOT LIKE '%TEST%'
            AND title NOT LIKE 'iphone111'
            AND title NOT LIKE 'aaaa%'
            AND title NOT LIKE '1111%'
            AND title NOT LIKE '333%'
            AND length(title) > 5
            ORDER BY created_at DESC
        """)
        return self.cursor.fetchall()

    def classify_product(self, title: str, description: str = "") -> int:
        """根据标题和描述分类商品"""
        text = f"{title} {description}".lower()

        # 分类优先级：护肤/彩妆 > 鞋类 > 服装 > 数码 > 其他
        priority_categories = [2022, 2021, 2023, 2015, 2014, 2012, 2011, 1011, 1023, 1021, 1033, 1034]

        best_match = None
        max_score = 0

        for category_id in priority_categories:
            if category_id not in CATEGORY_KEYWORDS:
                continue

            config = CATEGORY_KEYWORDS[category_id]
            score = 0

            # 检查排除关键词
            excluded = False
            for exclusion in config['exclusions']:
                if exclusion.lower() in text:
                    excluded = True
                    break

            if excluded:
                continue

            # 计算匹配分数
            for keyword in config['keywords']:
                if keyword.lower() in text:
                    # 根据关键词长度和位置给分
                    if keyword.lower() == text.strip():
                        score += 10  # 完全匹配
                    elif text.startswith(keyword.lower()):
                        score += 5   # 开头匹配
                    else:
                        score += len(keyword)  # 部分匹配，长关键词权重更高

            if score > max_score:
                max_score = score
                best_match = category_id

        # 如果没有匹配，返回其他分类
        return best_match if best_match else 9001

    def preview_categorization(self, limit: int = 50):
        """预览分类结果"""
        products = self.get_uncategorized_products()

        print(f"需要重新分类的商品总数: {len(products)}")
        print(f"预览前 {min(limit, len(products))} 个分类结果：")
        print("=" * 120)

        category_stats = {}

        for i, (product_id, title, description, current_category) in enumerate(products[:limit]):
            new_category = self.classify_product(title, description or "")

            # 获取分类名称
            self.cursor.execute("SELECT name FROM product_categories WHERE id = %s", (new_category,))
            category_result = self.cursor.fetchone()
            category_name = category_result[0] if category_result else "未知分类"

            category_stats[new_category] = category_stats.get(new_category, 0) + 1

            print(f"{i+1:2d}. {product_id}")
            print(f"    标题: {title[:60]}{'...' if len(title) > 60 else ''}")
            print(f"    当前分类: {current_category} -> 新分类: {new_category} ({category_name})")
            print()

        print("\n分类统计预览:")
        for cat_id, count in sorted(category_stats.items()):
            self.cursor.execute("SELECT name FROM product_categories WHERE id = %s", (cat_id,))
            category_result = self.cursor.fetchone()
            category_name = category_result[0] if category_result else "未知分类"
            print(f"  {category_name} ({cat_id}): {count} 个商品")

        if len(products) > limit:
            print(f"\n... 还有 {len(products) - limit} 个商品需要分类")

        return len(products)

    def execute_categorization(self):
        """执行批量分类"""
        products = self.get_uncategorized_products()

        if not products:
            print("没有需要重新分类的商品")
            return

        print(f"开始重新分类 {len(products)} 个商品...")

        updated_count = 0
        failed_count = 0
        category_stats = {}

        for product_id, title, description, current_category in products:
            try:
                new_category = self.classify_product(title, description or "")
                category_stats[new_category] = category_stats.get(new_category, 0) + 1

                # 如果分类没有变化，跳过
                if new_category == current_category:
                    continue

                # 更新数据库
                self.cursor.execute("""
                    UPDATE products
                    SET category_id = %s, updated_at = NOW()
                    WHERE id = %s
                """, (new_category, product_id))

                updated_count += 1

                if updated_count % 50 == 0:
                    print(f"已分类 {updated_count} 个商品...")

            except Exception as e:
                print(f"分类商品 {product_id} 失败: {e}")
                failed_count += 1

        # 提交更改
        self.conn.commit()

        print(f"\n分类完成!")
        print(f"成功重新分类: {updated_count} 个商品")
        print(f"失败: {failed_count} 个")

        print("\n最终分类统计:")
        for cat_id, count in sorted(category_stats.items()):
            self.cursor.execute("SELECT name FROM product_categories WHERE id = %s", (cat_id,))
            category_result = self.cursor.fetchone()
            category_name = category_result[0] if category_result else "未知分类"
            print(f"  {category_name} ({cat_id}): {count} 个商品")

    def close(self):
        """关闭数据库连接"""
        self.cursor.close()
        self.conn.close()

def main():
    categorizer = ProductCategorizer()

    try:
        # 预览分类结果
        total_count = categorizer.preview_categorization()

        if total_count == 0:
            return

        print("\n" + "=" * 120)
        choice = input(f"是否执行商品重新分类? (输入 'yes' 确认): ")

        if choice.lower() == 'yes':
            categorizer.execute_categorization()
        else:
            print("操作已取消")

    finally:
        categorizer.close()

if __name__ == "__main__":
    main()