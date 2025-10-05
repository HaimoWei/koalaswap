#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
闲鱼爬虫 - Demo版本
仅爬取10个商品用于测试
"""

from goofish_base import GoofishBaseScraper

class GoofishDemo(GoofishBaseScraper):
    def __init__(self):
        super().__init__("demo")
        self.target_products = 10
        self.target_users = 10

    def run_demo_scraping(self):
        """运行Demo爬取"""
        print(f"\n{'='*60}")
        print(f"🧪 闲鱼爬虫 - Demo测试版本")
        print(f"{'='*60}")
        print(f"目标: {self.target_products} 商品, {self.target_users} 用户")
        print(f"用途: 测试爬虫功能和数据质量")
        print(f"{'='*60}")

        # Demo关键词：使用更不同的关键词
        keywords = ["iPhone手机", "华为手机", "小米手机"]

        total_scraped = 0

        for keyword in keywords:
            if total_scraped >= self.target_products:
                break

            remaining = self.target_products - total_scraped
            batch_size = min(5, remaining)  # 每个关键词最多5个，确保多样性

            print(f"\n[Demo] 测试关键词: {keyword}")
            scraped = self.scrape_search_results(keyword, batch_size)
            total_scraped += scraped

            # 保存进度
            self.save_progress(self.target_products)

            if total_scraped >= self.target_products:
                break

            # 关键词间短暂休息
            if scraped > 0:
                print(f"[Demo] 短暂休息...")
                self.smart_delay(5)  # Demo版本休息时间更短

        print(f"\n{'='*60}")
        print(f"🎉 Demo测试完成!")
        print(f"总计商品: {len(self.products)}")
        print(f"总计用户: {len(set(u['email'] for u in self.users))}")
        print(f"完成率: {len(self.products)/self.target_products*100:.1f}%")
        print(f"{'='*60}")
        print(f"📁 数据文件:")
        print(f"  - dataset/products_demo.json")
        print(f"  - dataset/users_demo.json")
        print(f"  - dataset/images/ (商品图片)")
        print(f"{'='*60}")

        # 显示示例商品
        if self.products:
            print(f"\n📱 示例商品:")
            for i, product in enumerate(self.products[:3]):
                print(f"  {i+1}. {product['title'][:50]}...")
                print(f"     价格: ${product['price']} AUD")
                print(f"     图片: {len(product['images'])} 张")

def main():
    scraper = GoofishDemo()

    try:
        if not scraper.connect_to_chrome():
            print("[失败] 无法连接到Chrome浏览器")
            print("[提示] 请确保Chrome已启动远程调试模式")
            print("       命令: \"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\" --remote-debugging-port=9222 --user-data-dir=\"C:\\temp\\chrome_debug\"")
            return

        scraper.run_demo_scraping()

        print(f"\n✅ Demo测试成功完成!")
        print(f"💡 如果数据质量满意，可以运行生产版本:")
        print(f"   python scripts/goofish_part1.py")
        print(f"   python scripts/goofish_part2.py")
        print(f"   ... (依次运行part1-part5)")

    except KeyboardInterrupt:
        print("\n[中断] 用户中断，保存当前进度...")
        scraper.save_progress(scraper.target_products)
    except Exception as e:
        print(f"[错误] 程序异常: {e}")
        scraper.save_progress(scraper.target_products)

if __name__ == "__main__":
    main()