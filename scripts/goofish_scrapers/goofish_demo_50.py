#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
闲鱼分配算法测试Demo - 50个商品版本
验证关键词平均分配和重试机制
"""

from goofish_base import GoofishBaseScraper
import time
import random
from datetime import datetime

class GoofishDemo50(GoofishBaseScraper):
    def __init__(self):
        super().__init__("demo50")
        self.target_products = 50
        self.target_users = 50


    def run_demo_50_scraping(self):
        """运行50个商品的分配测试"""
        print(f"\n{'='*60}")
        print(f"[测试] 闲鱼分配算法测试 - 50个商品版本")
        print(f"{'='*60}")
        print(f"目标: {self.target_products} 个商品")
        print(f"用途: 验证关键词平均分配和重试机制")
        print(f"{'='*60}")

        # 选择25个不同类别的关键词进行测试 - 每个抓2个商品
        test_keywords = [
            # 数码类
            "iPhone手机", "华为手机", "小米手机", "OPPO手机", "vivo手机",
            "iPad", "华为平板", "小米平板", "耳机", "充电宝",

            # 服装类
            "连衣裙", "T恤", "牛仔裤", "外套", "卫衣",

            # 鞋类
            "耐克鞋", "阿迪达斯", "运动鞋", "帆布鞋", "高跟鞋",

            # 美妆日用
            "化妆品", "口红", "护肤品", "香水", "书包"
        ]

        total_scraped = 0
        session_start_time = time.time()

        # 计算每个关键词的目标分配
        target_per_keyword = self.target_products // len(test_keywords)  # 50 ÷ 25 = 2
        keyword_targets = {}

        for keyword in test_keywords:
            keyword_targets[keyword] = target_per_keyword

        # 处理余数分配
        extra_needed = self.target_products - (target_per_keyword * len(test_keywords))
        for i in range(extra_needed):
            keyword_targets[test_keywords[i]] += 1

        print(f"[策略] 每个关键词目标: {target_per_keyword} 个商品 (25个关键词x2个商品)")
        print(f"[分配] 详细目标分配:")
        for keyword, target in keyword_targets.items():
            print(f"   {keyword}: {target} 个")

        # 开始爬取
        for i, keyword in enumerate(test_keywords, 1):
            if total_scraped >= self.target_products:
                break

            keyword_target = keyword_targets[keyword]
            keyword_scraped = 0
            attempts = 0
            max_attempts = 3

            # 显示进度
            progress = total_scraped / self.target_products * 100
            elapsed_time = (time.time() - session_start_time) / 60  # 分钟

            print(f"\n[进度] 进度报告 [{i}/{len(test_keywords)}]")
            print(f"   关键词: {keyword} (目标: {keyword_target} 个)")
            print(f"   总进度: {total_scraped}/{self.target_products} ({progress:.1f}%)")
            print(f"   运行时间: {elapsed_time:.1f} 分钟")

            # 简化：直接尝试获取目标数量的商品
            remaining_for_keyword = min(keyword_target, self.target_products - total_scraped)

            if remaining_for_keyword > 0:
                print(f"[尝试] 关键词 '{keyword}' 目标获取 {remaining_for_keyword} 个商品")
                scraped = self.scrape_search_results(keyword, remaining_for_keyword)
                keyword_scraped = scraped
                total_scraped += scraped

                # 保存进度
                self.save_progress(self.target_products)

                if scraped > 0:
                    print(f"[成功] 关键词 '{keyword}' 获得 {scraped} 个商品")
                else:
                    print(f"[警告] 关键词 '{keyword}' 未找到商品")

            # 显示该关键词的最终结果
            success_rate = keyword_scraped / keyword_target * 100 if keyword_target > 0 else 0
            print(f"[完成] 关键词 '{keyword}': {keyword_scraped}/{keyword_target} 个商品 ({success_rate:.1f}%)")

            # 关键词间休息
            if total_scraped < self.target_products and i < len(test_keywords):
                print(f"[休息] 关键词间休息...")
                self.smart_delay(8)

        # 最终统计报告
        elapsed_minutes = (time.time() - session_start_time) / 60
        unique_users = len(set(u['email'] for u in self.users))

        print(f"\n{'='*60}")
        print(f"[完成] 50个商品测试完成!")
        print(f"{'='*60}")
        print(f"[统计] 最终统计:")
        print(f"   总商品数: {len(self.products)}")
        print(f"   总用户数: {unique_users}")
        print(f"   目标完成率: {len(self.products)/self.target_products*100:.1f}%")
        print(f"   总运行时间: {elapsed_minutes:.1f} 分钟")
        print(f"{'='*60}")

        # 显示各关键词分布统计
        keyword_distribution = {}
        for product in self.products:
            keyword = product['keyword']
            keyword_distribution[keyword] = keyword_distribution.get(keyword, 0) + 1

        print(f"[分布] 关键词分布统计:")
        for keyword, count in keyword_distribution.items():
            target = keyword_targets.get(keyword, 0)
            percentage = count / target * 100 if target > 0 else 0
            print(f"   {keyword}: {count}/{target} 个 ({percentage:.1f}%)")

        print(f"\n[文件] 数据文件:")
        print(f"   - dataset/products_demo50.json")
        print(f"   - dataset/users_demo50.json")
        print(f"   - dataset/images/ ({len(self.products)} 张图片)")

def main():
    scraper = GoofishDemo50()

    try:
        if not scraper.connect_to_chrome():
            print("[失败] 无法连接到Chrome浏览器")
            print("[提示] 请确保Chrome已启动远程调试模式")
            return

        print("[测试] 这是多类别商品分配测试")
        print("   目标: 验证50个商品能否分配给25个不同关键词")
        print("   预计: 每个关键词2个商品 (数码/鞋类/服装/美妆/日用品)")

        input("\n按回车键开始测试...")

        scraper.run_demo_50_scraping()

        print(f"\n[完成] 测试完成!")
        print(f"[检查] 请检查关键词分布是否均匀")
        print(f"[预测] 如果分布合理，500个商品版本也会正常工作")

    except KeyboardInterrupt:
        print(f"\n[中断] 用户中断，保存当前进度...")
        scraper.save_progress(scraper.target_products)
    except Exception as e:
        print(f"[错误] 程序异常: {e}")
        scraper.save_progress(scraper.target_products)

if __name__ == "__main__":
    main()