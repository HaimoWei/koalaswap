#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
闲鱼完整爬虫 - 合并版本
目标：500个商品，200个用户
适合挂机运行，包含所有关键词
"""

from goofish_base import GoofishBaseScraper
import time
import random
from datetime import datetime

class GoofishComplete(GoofishBaseScraper):
    def __init__(self):
        super().__init__("complete")
        self.target_products = 800
        self.target_users = 300


    def run_complete_scraping(self):
        """运行完整爬取"""
        print(f"\n{'='*60}")
        print(f"🐨 闲鱼完整爬虫 - 挂机版本")
        print(f"{'='*60}")
        print(f"目标: {self.target_products} 商品, {self.target_users} 用户")
        print(f"预计运行时间: 3-4小时")
        print(f"包含: 数码/服装/鞋类/美妆/日用品/家居/运动等40个类别")
        print(f"{'='*60}")

        # 完整关键词列表 - 40个多类别关键词，每个抓20个商品
        all_keywords = [
            # 数码类 (12个)
            "iPhone手机", "华为手机", "小米手机", "OPPO手机", "vivo手机", "三星手机",
            "iPad", "华为平板", "小米平板", "耳机", "充电宝", "蓝牙音箱",

            # 服装类 (8个)
            "连衣裙", "T恤", "牛仔裤", "外套", "卫衣", "衬衫", "毛衣", "裙子",

            # 鞋类 (6个)
            "耐克鞋", "阿迪达斯", "运动鞋", "帆布鞋", "高跟鞋", "靴子",

            # 美妆护肤 (6个)
            "化妆品", "口红", "护肤品", "香水", "面膜", "洗面奶",

            # 生活用品 (8个)
            "书包", "背包", "钱包", "手表", "眼镜", "帽子", "围巾", "手套"
        ]

        total_scraped = 0
        session_start_time = time.time()

        print(f"[开始] 共 {len(all_keywords)} 个关键词待处理")

        # 设置每个关键词的目标分配
        target_per_keyword = self.target_products // len(all_keywords)  # 平均分配
        keyword_targets = {}

        for keyword in all_keywords:
            keyword_targets[keyword] = target_per_keyword

        # 给前几个关键词多分配一些，确保总数达标
        extra_needed = self.target_products - (target_per_keyword * len(all_keywords))
        for i in range(extra_needed):
            keyword_targets[all_keywords[i]] += 1

        print(f"[策略] 每个关键词目标商品数: {target_per_keyword} 个 (40个关键词 × 20个商品)")

        for i, keyword in enumerate(all_keywords, 1):
            if total_scraped >= self.target_products:
                break

            keyword_target = keyword_targets[keyword]
            keyword_scraped = 0
            attempts = 0
            max_attempts = 3

            # 显示进度
            remaining = self.target_products - total_scraped
            progress = total_scraped / self.target_products * 100
            elapsed_time = (time.time() - session_start_time) / 3600

            print(f"\n📊 进度报告 [{i}/{len(all_keywords)}]")
            print(f"   关键词: {keyword} (目标: {keyword_target} 个)")
            print(f"   已完成: {total_scraped}/{self.target_products} ({progress:.1f}%)")
            print(f"   剩余: {remaining} 个商品")
            print(f"   运行时间: {elapsed_time:.1f} 小时")

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

            print(f"[完成] 关键词 '{keyword}' 总共获得 {keyword_scraped}/{keyword_target} 个商品")

            # 关键词间休息
            if total_scraped < self.target_products:
                print(f"[休息] 关键词间休息...")
                self.smart_delay(self.page_delay)

            # 每爬取50个商品后长休息一次
            if total_scraped > 0 and total_scraped % 50 == 0:
                print(f"[长休息] 已爬取 {total_scraped} 个商品，长休息 2 分钟...")
                time.sleep(120)

        # 最终统计
        elapsed_hours = (time.time() - session_start_time) / 3600
        unique_users = len(set(u['email'] for u in self.users))

        print(f"\n{'='*60}")
        print(f"🎉 完整爬取完成!")
        print(f"{'='*60}")
        print(f"📈 最终统计:")
        print(f"   总商品数: {len(self.products)}")
        print(f"   总用户数: {unique_users}")
        print(f"   目标完成率: {len(self.products)/self.target_products*100:.1f}%")
        print(f"   总运行时间: {elapsed_hours:.1f} 小时")
        print(f"   平均每商品: {elapsed_hours*3600/len(self.products):.1f} 秒")
        print(f"{'='*60}")
        print(f"📁 数据文件:")
        print(f"   - dataset/products_complete.json")
        print(f"   - dataset/users_complete.json")
        print(f"   - dataset/images/ ({len(self.products)} 张图片)")
        print(f"{'='*60}")

        # 显示部分商品示例
        if self.products:
            print(f"\n📱 商品示例:")
            for i, product in enumerate(self.products[:5]):
                print(f"  {i+1}. {product['title'][:50]}... - ${product['price']} AUD")

def main():
    import time

    scraper = GoofishComplete()

    try:
        if not scraper.connect_to_chrome():
            print("[失败] 无法连接到Chrome浏览器")
            print("[提示] 请确保Chrome已启动远程调试模式")
            print("       命令: \"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\" --remote-debugging-port=9222 --user-data-dir=\"C:\\temp\\chrome_debug\"")
            return

        print("⚠️  挂机爬取提醒:")
        print("   - 确保电脑不会休眠")
        print("   - 确保网络连接稳定")
        print("   - 预计运行 3-4 小时 (40个关键词策略)")
        print("   - 可以随时按 Ctrl+C 安全中断")

        input("\n按回车键开始挂机爬取...")

        scraper.run_complete_scraping()

        print(f"\n✅ 挂机爬取成功完成!")
        print(f"💤 可以安心睡觉了，数据已全部保存!")

    except KeyboardInterrupt:
        print(f"\n[中断] 用户中断，保存当前进度...")
        scraper.save_progress(scraper.target_products)
        print(f"💾 进度已保存，可以稍后继续运行相同脚本")
    except Exception as e:
        print(f"[错误] 程序异常: {e}")
        scraper.save_progress(scraper.target_products)
        print(f"💾 进度已保存")

if __name__ == "__main__":
    main()