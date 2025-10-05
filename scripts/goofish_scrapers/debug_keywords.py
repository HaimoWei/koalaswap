#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
关键词调试工具 - 对比成功和失败的关键词
分析为什么某些关键词能提取商品而另一些不能
"""

from goofish_base import GoofishBaseScraper
import time
from selenium.webdriver.common.by import By

class KeywordDebugger(GoofishBaseScraper):
    def __init__(self):
        super().__init__("debug")

    def debug_keyword_comparison(self):
        """对比成功和失败的关键词"""
        print(f"\n{'='*60}")
        print(f"🔍 关键词调试 - 对比分析")
        print(f"{'='*60}")

        # 测试关键词：1个成功的，1个失败的
        test_cases = [
            {"keyword": "iPhone手机", "expected": "SUCCESS", "description": "已知成功的关键词"},
            {"keyword": "华为手机", "expected": "FAILURE", "description": "已知失败的关键词"},
        ]

        for case in test_cases:
            keyword = case["keyword"]
            expected = case["expected"]
            description = case["description"]

            print(f"\n📱 测试关键词: {keyword}")
            print(f"   预期结果: {expected}")
            print(f"   描述: {description}")
            print(f"   {'─'*50}")

            # 访问搜索页面
            search_url = f"https://www.goofish.com/search?q={keyword}"
            print(f"[访问] {search_url}")

            self.driver.get(search_url)
            self.smart_delay(8)

            # 滚动加载
            print(f"[滚动] 加载更多内容...")
            for i in range(5):
                self.driver.execute_script(f"window.scrollTo(0, {(i+1) * 1000});")
                time.sleep(2)

            # 查找商品元素
            product_elements = self.driver.find_elements(By.CSS_SELECTOR, 'a[class*="feeds-item-wrap"]')
            print(f"[发现] 找到 {len(product_elements)} 个商品元素")

            if len(product_elements) == 0:
                print(f"[错误] 未找到任何商品元素！可能页面结构变化或网络问题")
                continue

            # 分析前3个元素
            valid_products = 0
            for i, element in enumerate(product_elements[:3]):
                print(f"\n   🔍 分析商品 {i+1}:")

                try:
                    # 提取文本
                    text = element.text.strip()
                    href = element.get_attribute('href')
                    print(f"      文本长度: {len(text)} 字符")
                    print(f"      文本预览: {text[:100]}...")
                    print(f"      链接: {href}")

                    # 文本长度检查
                    if not text or len(text) < 20:
                        print(f"      ❌ 文本太短，已跳过")
                        continue

                    # 查找图片
                    images = element.find_elements(By.TAG_NAME, 'img')
                    print(f"      找到 {len(images)} 个图片元素")

                    valid_images = 0
                    for j, img in enumerate(images[:3]):
                        src = img.get_attribute('src') or img.get_attribute('data-src')
                        width = img.get_attribute('width')
                        height = img.get_attribute('height')
                        img_class = img.get_attribute('class') or ''

                        print(f"         图片 {j+1}:")
                        print(f"           URL: {src}")
                        print(f"           尺寸: {width}x{height}")
                        print(f"           类名: {img_class}")

                        if src and any(x in src for x in ['alicdn', 'taobaocdn']):
                            # 使用当前的严格过滤逻辑
                            is_valid = self.is_valid_product_image(src, img)
                            print(f"           是否有效: {'✅ YES' if is_valid else '❌ NO'}")

                            if is_valid:
                                valid_images += 1

                                # 测试图片下载
                                print(f"           测试下载...")
                                test_filename = f"debug_{keyword}_{i+1}_{j+1}.jpg"
                                download_success = self.download_image(src, test_filename)
                                print(f"           下载结果: {'✅ SUCCESS' if download_success else '❌ FAILED'}")
                        else:
                            print(f"           ❌ 不是阿里CDN图片")

                    print(f"      有效图片数: {valid_images}")

                    if valid_images > 0:
                        valid_products += 1
                        print(f"      ✅ 该商品可以被提取")
                    else:
                        print(f"      ❌ 该商品会被过滤掉")

                except Exception as e:
                    print(f"      ❌ 处理出错: {e}")

            print(f"\n   📊 总结:")
            print(f"      元素总数: {len(product_elements)}")
            print(f"      有效商品: {valid_products}/3")
            print(f"      预测结果: {'✅ 成功' if valid_products > 0 else '❌ 失败'}")
            print(f"      与预期: {'✅ 匹配' if (valid_products > 0) == (expected == 'SUCCESS') else '❌ 不匹配'}")

            # 关键词间休息
            if case != test_cases[-1]:
                print(f"\n[休息] 准备测试下一个关键词...")
                time.sleep(5)

        print(f"\n{'='*60}")
        print(f"🎯 调试完成!")
        print(f"💡 如果两个关键词的行为不同，说明问题在于内容差异")
        print(f"📝 检查图片过滤逻辑是否过于严格")
        print(f"{'='*60}")

def main():
    debugger = KeywordDebugger()

    try:
        if not debugger.connect_to_chrome():
            print("❌ 无法连接到Chrome浏览器")
            print("💡 请确保Chrome已启动远程调试模式")
            return

        print("🔍 开始关键词对比调试...")
        debugger.debug_keyword_comparison()

    except KeyboardInterrupt:
        print("\n🛑 用户中断调试")
    except Exception as e:
        print(f"❌ 调试出错: {e}")

if __name__ == "__main__":
    main()