#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
闲鱼补充爬虫 - 电子数码产品专项
补充相机、更多苹果产品等，避免重复爬取
"""

from goofish_base import GoofishBaseScraper
import json
import os

class GoofishSupplement(GoofishBaseScraper):
    def __init__(self):
        super().__init__("supplement")
        self.target_products = 200  # 补充200个数码产品
        self.target_users = 100
        self.existing_urls = set()  # 存储已有商品URL避免重复

    def load_existing_data(self):
        """加载现有数据以避免重复"""
        try:
            # 加载现有商品数据
            if os.path.exists('../../dataset/products_complete.json'):
                with open('../../dataset/products_complete.json', 'r', encoding='utf-8') as f:
                    existing_products = json.load(f)

                # 提取现有商品的URL
                for product in existing_products:
                    if 'source_url' in product:
                        self.existing_urls.add(product['source_url'])

                print(f"[去重] 已加载 {len(self.existing_urls)} 个现有商品URL")

                # 将现有商品添加到当前列表中
                self.products.extend(existing_products)

            # 加载现有用户数据
            if os.path.exists('../../dataset/users_complete.json'):
                with open('../../dataset/users_complete.json', 'r', encoding='utf-8') as f:
                    existing_users = json.load(f)
                    self.users.extend(existing_users)

                print(f"[去重] 已加载 {len(existing_users)} 个现有用户")

        except Exception as e:
            print(f"[警告] 加载现有数据时出错: {e}")

    def is_duplicate_url(self, url):
        """检查URL是否重复"""
        return url in self.existing_urls

    def scrape_search_results_with_dedup(self, keyword, max_items=20):
        """带去重功能的搜索结果爬取"""
        from selenium.webdriver.common.by import By
        import time
        import random
        from datetime import datetime

        print(f"\n[搜索] 关键词: {keyword}")
        search_url = f"https://www.goofish.com/search?q={keyword}"
        print(f"[访问] {search_url}")

        self.driver.get(search_url)
        self.smart_delay(8)

        # 滚动加载更多内容
        for i in range(5):
            self.driver.execute_script(f"window.scrollTo(0, {(i+1) * 1000});")
            time.sleep(random.uniform(2, 4))

        # 查找商品元素
        product_elements = self.driver.find_elements(By.CSS_SELECTOR, 'a[class*="feeds-item-wrap"]')
        print(f"[发现] 找到 {len(product_elements)} 个商品元素")

        scraped_count = 0
        duplicate_count = 0

        for i, element in enumerate(product_elements[:max_items * 3]):  # 多处理一些以补偿重复过滤
            if scraped_count >= max_items:
                break

            try:
                # 提取基本信息
                text = element.text.strip()
                href = element.get_attribute('href')

                if not text or len(text) < 20:
                    continue

                # 检查URL是否重复
                if self.is_duplicate_url(href):
                    duplicate_count += 1
                    continue

                # 添加到已处理URL集合
                self.existing_urls.add(href)

                # 提取价格
                price = self.extract_price(text)

                # 提取图片
                images = element.find_elements(By.TAG_NAME, 'img')
                image_urls = []

                for img in images:
                    src = img.get_attribute('src') or img.get_attribute('data-src')
                    if src and any(x in src for x in ['alicdn', 'taobaocdn']):
                        if self.is_valid_product_image(src, img):
                            image_urls.append(src)

                if not image_urls:
                    continue

                # 生成商品ID - 使用新的序号继续编号
                product_id = f"goofish_{self.part_name}_{len(self.products) + 1}"

                # 翻译标题
                title = self.translate_title(text[:100])

                # 下载图片
                downloaded_images = []
                for j, img_url in enumerate(image_urls[:5]):
                    filename = f"{product_id}_{j}.jpg"
                    if self.download_image(img_url, filename):
                        downloaded_images.append({
                            "filename": filename,
                            "is_primary": j == 0,
                            "sort_order": j,
                            "source_url": img_url
                        })

                if not downloaded_images:
                    continue

                # 生成用户数据
                user = self.generate_user_data(text)
                self.users.append(user)

                # 构建商品数据
                product = {
                    "id": product_id,
                    "title": title,
                    "description": f"Pre-owned {title} - genuine item with normal wear. Works perfectly.",
                    "price": int(price * 1.5) if price else random.randint(200, 2000),
                    "currency": "AUD",
                    "condition": random.choice(["EXCELLENT", "GOOD", "FAIR"]),
                    "category": "Smart Phones",
                    "images": downloaded_images,
                    "created_at": datetime.now().isoformat(),
                    "keyword": keyword,
                    "source": "goofish_logged",
                    "seller_id": user["id"],
                    "original_text": text,
                    "source_url": href,
                    "part": self.part_name
                }

                self.products.append(product)
                scraped_count += 1

                print(f"[成功] 商品 {scraped_count}: {title[:50]}...")
                print(f"    价格: ${product['price']} AUD")
                print(f"    图片: {len(downloaded_images)} 张")

                # 商品间延迟
                self.smart_delay(3)

            except Exception as e:
                print(f"[错误] 处理商品时出错: {e}")
                continue

        print(f"[去重] 跳过 {duplicate_count} 个重复商品")
        return scraped_count

    def run_supplement_scraping(self):
        """运行补充爬取"""
        print(f"\n{'='*60}")
        print(f"[补充] 闲鱼电子数码产品补充爬虫")
        print(f"{'='*60}")
        print(f"目标: 补充 {self.target_products} 个电子数码产品")
        print(f"特色: 相机、更多苹果产品、高端数码设备")
        print(f"{'='*60}")

        # 先加载现有数据
        self.load_existing_data()

        # 电子数码产品专项关键词
        digital_keywords = [
            # 相机类 (8个)
            "相机", "单反相机", "微单相机", "佳能相机", "尼康相机",
            "索尼相机", "富士相机", "拍立得",

            # 苹果产品扩展 (8个)
            "MacBook", "iMac", "Mac", "Apple Watch", "AirPods",
            "iPad Pro", "iPad Air", "iPad mini",

            # 高端数码 (8个)
            "笔记本电脑", "游戏本", "显卡", "CPU", "机械键盘",
            "显示器", "音响", "投影仪",

            # 手机配件 (8个)
            "手机壳", "钢化膜", "车载支架", "无线充电器",
            "移动电源", "数据线", "蓝牙键盘", "平板支架"
        ]

        original_product_count = len(self.products)
        total_scraped = 0

        # 计算每个关键词的目标分配
        target_per_keyword = self.target_products // len(digital_keywords)

        print(f"[策略] 每个关键词目标: {target_per_keyword} 个商品")
        print(f"[去重] 当前已有 {original_product_count} 个商品")

        for i, keyword in enumerate(digital_keywords, 1):
            if total_scraped >= self.target_products:
                break

            remaining = min(target_per_keyword, self.target_products - total_scraped)

            print(f"\n[进度] 关键词 [{i}/{len(digital_keywords)}]: {keyword}")
            print(f"   目标获取: {remaining} 个商品")
            print(f"   总进度: {total_scraped}/{self.target_products}")

            scraped = self.scrape_search_results_with_dedup(keyword, remaining)
            total_scraped += scraped

            # 保存进度
            self.save_progress(original_product_count + self.target_products)

            print(f"[完成] 关键词 '{keyword}' 获得 {scraped} 个新商品")

            # 关键词间休息
            if total_scraped < self.target_products:
                print(f"[休息] 关键词间休息...")
                self.smart_delay(10)

        # 最终统计
        final_product_count = len(self.products)
        new_products = final_product_count - original_product_count
        unique_users = len(set(u['email'] for u in self.users))

        print(f"\n{'='*60}")
        print(f"[完成] 电子数码产品补充完成!")
        print(f"{'='*60}")
        print(f"[统计] 最终统计:")
        print(f"   原有商品: {original_product_count} 个")
        print(f"   新增商品: {new_products} 个")
        print(f"   总商品数: {final_product_count} 个")
        print(f"   总用户数: {unique_users} 个")
        print(f"   新增完成率: {new_products/self.target_products*100:.1f}%")
        print(f"{'='*60}")

        print(f"[文件] 数据文件:")
        print(f"   - dataset/products_supplement.json (合并后的完整数据)")
        print(f"   - dataset/users_supplement.json (合并后的用户数据)")

def main():
    scraper = GoofishSupplement()

    try:
        if not scraper.connect_to_chrome():
            print("[失败] 无法连接到Chrome浏览器")
            print("[提示] 请确保Chrome已启动远程调试模式")
            return

        print("[补充] 电子数码产品补充爬取")
        print("   特色: 相机、苹果产品、高端数码设备")
        print("   智能去重: 自动跳过已有商品")

        input("\n按回车键开始补充爬取...")

        scraper.run_supplement_scraping()

        print(f"\n[完成] 补充爬取成功完成!")
        print(f"[提示] 数据已与原有商品合并保存")

    except KeyboardInterrupt:
        print(f"\n[中断] 用户中断，保存当前进度...")
        scraper.save_progress(len(scraper.products))
    except Exception as e:
        print(f"[错误] 程序异常: {e}")
        scraper.save_progress(len(scraper.products))

if __name__ == "__main__":
    main()