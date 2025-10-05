#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
闲鱼爬虫基础类
包含所有共用的方法和配置
"""

import time
import json
import random
import re
import os
import requests
import uuid
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

class GoofishBaseScraper:
    def __init__(self, part_name=""):
        self.driver = None
        self.products = []
        self.users = []
        self.part_name = part_name
        self.session_id = datetime.now().strftime("%Y%m%d_%H%M%S")

        # 安全配置
        self.min_delay = 8
        self.max_delay = 15
        self.page_delay = 12

        # 确保目录存在
        os.makedirs('dataset/images', exist_ok=True)
        os.makedirs('dataset/logs', exist_ok=True)

    def connect_to_chrome(self):
        """连接到已登录的Chrome"""
        print("[连接] 连接到已登录的Chrome浏览器...")

        chrome_options = Options()
        chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")

        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            print("[成功] 已连接到Chrome浏览器")
            return True
        except Exception as e:
            print(f"[失败] 无法连接到Chrome: {e}")
            return False

    def smart_delay(self, base_delay=None):
        """智能延迟"""
        if base_delay:
            delay = random.uniform(base_delay * 0.8, base_delay * 1.2)
        else:
            delay = random.uniform(self.min_delay, self.max_delay)

        print(f"[延迟] {delay:.1f}秒")
        time.sleep(delay)

    def is_valid_product_image(self, src, img_element):
        """严格验证是否为真正的商品图片"""

        # 1. URL黑名单过滤 - 修复版本，移除误判的O1CN01
        url_blacklist = [
            'icon', 'logo', 'avatar', 'banner', 'badge', 'tag',
            'button', 'arrow', 'star', 'heart', 'share', 'like',
            'shipping', 'delivery', 'payment', 'guarantee', 'service',
            'placeholder', 'loading', 'default-avatar', 'no-image'
        ]

        if any(keyword in src.lower() for keyword in url_blacklist):
            return False

        # 2. 尺寸过滤：图标通常很小
        try:
            width = img_element.get_attribute('width')
            height = img_element.get_attribute('height')

            if width and height:
                w, h = int(width), int(height)
                # 过滤小图标 (通常商品图片至少100x100)
                if w < 100 or h < 100:
                    return False
                # 过滤超宽或超高的banner图
                if w/h > 5 or h/w > 5:
                    return False
        except:
            pass

        # 3. CSS类名过滤
        img_class = img_element.get_attribute('class') or ''
        class_blacklist = [
            'icon', 'logo', 'avatar', 'badge', 'tag', 'button',
            'service', 'guarantee', 'shipping', 'payment'
        ]

        if any(keyword in img_class.lower() for keyword in class_blacklist):
            return False

        # 4. 修复后的路径检查 - 大多数Goofish图片都是有效的
        # 只过滤明显的小图标，保留所有可能的商品图片
        try:
            width = img_element.get_attribute('width')
            height = img_element.get_attribute('height')
            if width and height:
                w, h = int(width), int(height)
                # 只过滤明显的小图标（小于50x50）
                if w < 50 or h < 50:
                    return False
        except:
            # 如果无法获取尺寸，通过URL参数判断
            if any(size in src for size in ['_24.', '_32.', '_48.']):
                return False

        # 5. 最终URL参数检查 - 过滤明显的小图标
        if any(size in src for size in ['_84.', '_96.', '_110.']):
            return False

        return True

    def download_image(self, image_url, filename):
        """下载图片"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }

            response = requests.get(image_url, headers=headers, timeout=30)
            if response.status_code == 200 and len(response.content) > 1000:
                filepath = f"dataset/images/{filename}"
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                print(f"[图片] 下载成功: {filename} ({len(response.content)} bytes)")
                return True
            else:
                print(f"[图片] 下载失败: {filename}")
                return False

        except Exception as e:
            print(f"[图片] 下载错误: {e}")
            return False

    def extract_price(self, text):
        """提取价格"""
        price_patterns = [
            r'[¥￥](\d+(?:\.\d{2})?)',
            r'(\d+(?:\.\d{2})?)元',
            r'(\d+(?:\.\d{2})?)万',
        ]

        for pattern in price_patterns:
            match = re.search(pattern, text)
            if match:
                price = float(match.group(1))
                if '万' in text:
                    price *= 10000
                return price
        return None

    def generate_user_data(self, source_text=""):
        """生成用户数据"""
        first_names = ["Michael", "Sarah", "David", "Emma", "James", "Lisa", "John", "Anna", "Peter", "Kate"]
        last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Wilson", "Moore"]
        cities = ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Canberra", "Darwin", "Hobart"]

        user_id = str(uuid.uuid4())
        first_name = random.choice(first_names)
        last_name = random.choice(last_names)

        return {
            "id": user_id,
            "username": f"{first_name.lower()}_{random.randint(100, 999)}",
            "email": f"{first_name.lower()}.{last_name.lower()}@{random.choice(['gmail.com', 'hotmail.com', 'yahoo.com'])}",
            "display_name": f"{first_name} {last_name}",
            "bio": f"Trusted seller in {random.choice(cities)}. Quality items, fast shipping.",
            "location": f"{random.choice(cities)}, Australia",
            "rating_avg": round(random.uniform(4.0, 5.0), 1),
            "rating_count": random.randint(50, 500),
            "member_since": f"20{random.randint(20, 23)}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}",
            "phone_verified": random.choice([True, False]),
            "email_verified": True,
            "source": "generated_from_goofish"
        }

    def translate_title(self, chinese_title):
        """简单的中英翻译映射"""
        translations = {
            'iPhone': 'iPhone', 'iphon': 'iPhone', '苹果': 'Apple', '手机': 'Phone',
            '华为': 'Huawei', '小米': 'Xiaomi', 'OPPO': 'OPPO', 'vivo': 'Vivo', '三星': 'Samsung',
            '全新': 'Brand New', '二手': 'Pre-owned', '95新': '95% New', '99新': 'Like New',
            '国行': 'Chinese Version', '港版': 'Hong Kong Version', '美版': 'US Version',
            '解锁': 'Unlocked', '原装': 'Original', '充电器': 'Charger', '耳机': 'Headphones',
            '保护壳': 'Case', '钢化膜': 'Screen Protector'
        }

        english_title = chinese_title
        for chinese, english in translations.items():
            english_title = english_title.replace(chinese, english)

        return english_title

    def scrape_search_results(self, keyword, max_items=100):
        """爬取搜索结果"""
        print(f"\n[搜索] 关键词: {keyword}")

        search_url = f"https://www.goofish.com/search?q={keyword}"
        print(f"[访问] {search_url}")

        self.driver.get(search_url)
        self.smart_delay(8)

        # 滚动加载更多内容
        for i in range(5):
            self.driver.execute_script(f"window.scrollTo(0, {(i+1) * 1000});")
            time.sleep(random.uniform(2, 4))

        # 使用正确的选择器
        product_elements = self.driver.find_elements(By.CSS_SELECTOR, 'a[class*="feeds-item-wrap"]')
        print(f"[发现] 找到 {len(product_elements)} 个商品元素")

        scraped_count = 0

        for i, element in enumerate(product_elements[:max_items]):
            try:
                # 提取基本信息
                text = element.text.strip()
                href = element.get_attribute('href')

                if not text or len(text) < 20:
                    continue

                # 提取价格
                price = self.extract_price(text)

                # 提取图片
                images = element.find_elements(By.TAG_NAME, 'img')
                image_urls = []

                for img in images:
                    src = img.get_attribute('src') or img.get_attribute('data-src')
                    if src and any(x in src for x in ['alicdn', 'taobaocdn']):
                        # 严格过滤：只保留真正的商品图片
                        if self.is_valid_product_image(src, img):
                            image_urls.append(src)

                if not image_urls:
                    continue

                # 生成商品ID
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
                if scraped_count % 10 == 0:
                    print(f"[进度] 已爬取 {scraped_count} 个商品，休息一下...")
                    self.smart_delay(self.page_delay)
                else:
                    self.smart_delay(3)

            except Exception as e:
                print(f"[错误] 处理商品时出错: {e}")
                continue

        print(f"[完成] 关键词 '{keyword}' 爬取完成: {scraped_count} 个商品")
        return scraped_count

    def save_progress(self, target_products=100):
        """保存进度"""
        # 保存商品数据
        filename = f'dataset/products_{self.part_name}.json' if self.part_name else 'dataset/products.json'
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.products, f, ensure_ascii=False, indent=2)

        # 保存用户数据（去重）
        unique_users = []
        seen_emails = set()
        for user in self.users:
            if user['email'] not in seen_emails:
                unique_users.append(user)
                seen_emails.add(user['email'])

        users_filename = f'dataset/users_{self.part_name}.json' if self.part_name else 'dataset/users.json'
        with open(users_filename, 'w', encoding='utf-8') as f:
            json.dump(unique_users, f, ensure_ascii=False, indent=2)

        # 保存进度信息
        progress = {
            "session_id": self.session_id,
            "part_name": self.part_name,
            "timestamp": datetime.now().isoformat(),
            "total_products": len(self.products),
            "total_users": len(unique_users),
            "target_products": target_products,
            "completion_rate": len(self.products) / target_products
        }

        progress_filename = f'dataset/progress_{self.part_name}_{self.session_id}.json'
        with open(progress_filename, 'w', encoding='utf-8') as f:
            json.dump(progress, f, ensure_ascii=False, indent=2)

        print(f"[保存] 进度已保存: {len(self.products)}/{target_products} 商品")