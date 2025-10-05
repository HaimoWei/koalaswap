#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
闲鱼爬虫 - 第5部分 (平板电脑)
目标：100个商品，40个用户
"""

from goofish_base import GoofishBaseScraper

class GoofishPart5(GoofishBaseScraper):
    def __init__(self):
        super().__init__("part5")
        self.target_products = 100
        self.target_users = 40

    def run_scraping(self):
        """运行第5部分爬取"""
        print(f"\n{'='*60}")
        print(f"🐨 闲鱼爬虫 - 第5部分 (平板电脑)")
        print(f"{'='*60}")
        print(f"目标: {self.target_products} 商品, {self.target_users} 用户")
        print(f"{'='*60}")

        # 第5部分关键词：平板电脑
        keywords = [
            "平板电脑", "iPad", "iPad Pro", "iPad Air", "iPad mini",
            "华为平板", "小米平板", "安卓平板", "二手平板", "平板二手"
        ]

        total_scraped = 0

        for keyword in keywords:
            if total_scraped >= self.target_products:
                break

            remaining = self.target_products - total_scraped
            batch_size = min(15, remaining)

            scraped = self.scrape_search_results(keyword, batch_size)
            total_scraped += scraped

            # 保存进度
            self.save_progress(self.target_products)

            # 关键词间休息
            if scraped > 0 and total_scraped < self.target_products:
                print(f"[休息] 关键词间休息...")
                self.smart_delay(self.page_delay)

        print(f"\n{'='*60}")
        print(f"🎉 第5部分爬取完成!")
        print(f"总计商品: {len(self.products)}")
        print(f"总计用户: {len(set(u['email'] for u in self.users))}")
        print(f"完成率: {len(self.products)/self.target_products*100:.1f}%")
        print(f"{'='*60}")

def main():
    scraper = GoofishPart5()

    try:
        if not scraper.connect_to_chrome():
            print("[失败] 无法连接到Chrome浏览器")
            print("[提示] 请确保Chrome已启动远程调试模式")
            return

        scraper.run_scraping()

    except KeyboardInterrupt:
        print("\n[中断] 用户中断，保存当前进度...")
        scraper.save_progress(scraper.target_products)
    except Exception as e:
        print(f"[错误] 程序异常: {e}")
        scraper.save_progress(scraper.target_products)

if __name__ == "__main__":
    main()