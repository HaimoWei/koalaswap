#!/usr/bin/env python3
"""
优化商品标题长度脚本
将过长的标题截断到合适长度，保留关键信息
"""

import re
import psycopg2
from typing import List, Tuple

# 数据库配置
DB_CONFIG = {
    'host': 'localhost',
    'port': 15433,
    'database': 'koalaswap_dev',
    'user': 'koalaswap',
    'password': 'secret'
}

# 优化配置
MAX_TITLE_LENGTH = 30  # 最大标题长度（字符数）
PREVIEW_LIMIT = 20     # 预览显示条数

class TitleOptimizer:
    def __init__(self):
        self.conn = psycopg2.connect(**DB_CONFIG)
        self.cursor = self.conn.cursor()

    def get_long_titles(self) -> List[Tuple[str, str]]:
        """获取标题过长的商品"""
        self.cursor.execute("""
            SELECT id, title
            FROM products
            WHERE length(title) > %s
            AND title NOT LIKE 'test%%'
            AND title NOT LIKE '%%test%%'
            ORDER BY length(title) DESC
        """, (MAX_TITLE_LENGTH,))

        return self.cursor.fetchall()

    def optimize_title(self, original_title: str) -> str:
        """优化单个标题"""
        title = original_title.strip()

        # 如果已经够短，直接返回
        if len(title) <= MAX_TITLE_LENGTH:
            return title

        # 移除常见的冗余信息
        patterns_to_remove = [
            r'【.*?】',  # 去掉方括号内容
            r'\+.*',     # 去掉+号后的内容
            r'！.*',     # 去掉感叹号后的内容
            r'，.*成色.*', # 去掉成色描述
            r'，.*不退不换.*', # 去掉退换货说明
            r'，.*包邮.*', # 去掉包邮说明
            r'，.*自提.*', # 去掉自提说明
            r'，.*小时前发布.*', # 去掉发布时间
            r'百分百好评.*', # 去掉好评说明
        ]

        for pattern in patterns_to_remove:
            title = re.sub(pattern, '', title)
            title = title.strip('，。！？ ')
            if len(title) <= MAX_TITLE_LENGTH:
                return title

        # 如果还是太长，智能截断
        if len(title) > MAX_TITLE_LENGTH:
            # 尝试在逗号或句号处截断
            for delimiter in ['，', '。', ' ']:
                parts = title.split(delimiter)
                current = parts[0]
                for i, part in enumerate(parts[1:], 1):
                    if len(current + delimiter + part) <= MAX_TITLE_LENGTH:
                        current += delimiter + part
                    else:
                        break
                if len(current) <= MAX_TITLE_LENGTH and len(current) > 10:
                    return current

            # 直接截断，但避免截断到字符中间
            truncated = title[:MAX_TITLE_LENGTH-1]
            # 找到最后一个完整的词
            for i in range(len(truncated)-1, 0, -1):
                if truncated[i] in '，。！？ ':
                    return truncated[:i]

            return truncated + '…'

        return title

    def preview_changes(self, limit: int = PREVIEW_LIMIT):
        """预览标题优化结果"""
        products = self.get_long_titles()

        print(f"发现 {len(products)} 个标题过长的商品")
        print(f"预览前 {min(limit, len(products))} 个优化结果：")
        print("=" * 100)

        for i, (product_id, original_title) in enumerate(products[:limit]):
            optimized_title = self.optimize_title(original_title)
            try:
                print(f"\n{i+1}. Product ID: {product_id}")
                print(f"   Original ({len(original_title)} chars): {original_title[:80]}{'...' if len(original_title) > 80 else ''}")
                print(f"   Optimized ({len(optimized_title)} chars): {optimized_title}")
            except UnicodeEncodeError:
                print(f"\n{i+1}. Product ID: {product_id}")
                print(f"   Original: [Unicode encoding issue - {len(original_title)} chars]")
                print(f"   Optimized: [Unicode encoding issue - {len(optimized_title)} chars]")

        if len(products) > limit:
            print(f"\n... 还有 {len(products) - limit} 个商品需要优化")

        return len(products)

    def execute_optimization(self):
        """执行标题优化"""
        products = self.get_long_titles()

        if not products:
            print("没有找到需要优化的标题")
            return

        print(f"开始优化 {len(products)} 个商品标题...")

        updated_count = 0
        failed_count = 0

        for product_id, original_title in products:
            try:
                optimized_title = self.optimize_title(original_title)

                # 如果标题没有变化，跳过
                if optimized_title == original_title:
                    continue

                # 更新数据库
                self.cursor.execute("""
                    UPDATE products
                    SET title = %s, updated_at = NOW()
                    WHERE id = %s
                """, (optimized_title, product_id))

                updated_count += 1

                if updated_count % 50 == 0:
                    print(f"已优化 {updated_count} 个标题...")

            except Exception as e:
                print(f"优化商品 {product_id} 失败: {e}")
                failed_count += 1

        # 提交更改
        self.conn.commit()

        print(f"\n优化完成!")
        print(f"成功优化: {updated_count} 个标题")
        print(f"失败: {failed_count} 个")

    def close(self):
        """关闭数据库连接"""
        self.cursor.close()
        self.conn.close()

def main():
    optimizer = TitleOptimizer()

    try:
        # 预览优化结果
        total_count = optimizer.preview_changes()

        if total_count == 0:
            return

        print("\n" + "=" * 100)
        choice = input(f"是否执行标题优化? (输入 'yes' 确认): ")

        if choice.lower() == 'yes':
            optimizer.execute_optimization()
        else:
            print("操作已取消")

    finally:
        optimizer.close()

if __name__ == "__main__":
    main()