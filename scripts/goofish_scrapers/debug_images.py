#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
调试图片提取 - 查看商品元素中的所有图片
"""

import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

def debug_product_images():
    """调试单个商品的图片情况"""

    chrome_options = Options()
    chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")

    driver = webdriver.Chrome(options=chrome_options)

    try:
        # 访问搜索页面
        driver.get("https://www.goofish.com/search?q=iPhone手机")
        time.sleep(5)

        # 滚动
        driver.execute_script("window.scrollTo(0, 1000);")
        time.sleep(3)

        # 获取第一个商品元素
        product_elements = driver.find_elements(By.CSS_SELECTOR, 'a[class*="feeds-item-wrap"]')

        if product_elements:
            first_product = product_elements[0]
            print(f"=== 第一个商品分析 ===")
            print(f"商品文本: {first_product.text[:100]}...")

            # 获取所有图片
            images = first_product.find_elements(By.TAG_NAME, 'img')
            print(f"\n找到 {len(images)} 张图片:")

            for i, img in enumerate(images):
                src = img.get_attribute('src') or img.get_attribute('data-src')
                width = img.get_attribute('width') or 'N/A'
                height = img.get_attribute('height') or 'N/A'
                img_class = img.get_attribute('class') or 'N/A'

                print(f"\n图片 {i+1}:")
                print(f"  URL: {src}")
                print(f"  尺寸: {width}x{height}")
                print(f"  类名: {img_class}")

                # 检查是否通过过滤
                is_valid = check_image_validity(src, img)
                print(f"  通过过滤: {is_valid}")

                if src:
                    # 检查具体的过滤原因
                    reasons = get_filter_reasons(src, img)
                    if reasons:
                        print(f"  过滤原因: {', '.join(reasons)}")

    finally:
        # 不关闭浏览器
        pass

def check_image_validity(src, img_element):
    """检查图片是否通过过滤（复制goofish_base.py的逻辑）"""

    if not src:
        return False

    if not any(x in src for x in ['alicdn', 'taobaocdn']):
        return False

    # URL黑名单
    url_blacklist = [
        'icon', 'logo', 'avatar', 'banner', 'badge', 'tag',
        'button', 'arrow', 'star', 'heart', 'share', 'like',
        'shipping', 'delivery', 'payment', 'guarantee', 'service',
        'tps-', 'imgextra/i1/', 'imgextra/i2/', 'imgextra/i3/', 'imgextra/i4/',
        '-2-tps-', 'O1CN01', '6000000', 'placeholder', 'loading'
    ]

    if any(keyword in src.lower() for keyword in url_blacklist):
        return False

    # 尺寸过滤
    try:
        width = img_element.get_attribute('width')
        height = img_element.get_attribute('height')

        if width and height:
            w, h = int(width), int(height)
            if w < 100 or h < 100:
                return False
            if w/h > 5 or h/w > 5:
                return False
    except:
        pass

    # CSS类名过滤
    img_class = img_element.get_attribute('class') or ''
    class_blacklist = [
        'icon', 'logo', 'avatar', 'badge', 'tag', 'button',
        'service', 'guarantee', 'shipping', 'payment'
    ]

    if any(keyword in img_class.lower() for keyword in class_blacklist):
        return False

    # 路径白名单
    product_patterns = [
        'bao/uploaded',
        'fleamarket',
        'mtopupload'
    ]

    if not any(pattern in src for pattern in product_patterns):
        return False

    # 参数过滤
    if any(size in src for size in ['_48.', '_84.', '_96.', '_110.']):
        return False

    return True

def get_filter_reasons(src, img_element):
    """获取图片被过滤的具体原因"""
    reasons = []

    if not src:
        reasons.append("无URL")
        return reasons

    if not any(x in src for x in ['alicdn', 'taobaocdn']):
        reasons.append("非阿里CDN")

    # URL黑名单检查
    url_blacklist = [
        'icon', 'logo', 'avatar', 'banner', 'badge', 'tag',
        'button', 'arrow', 'star', 'heart', 'share', 'like',
        'shipping', 'delivery', 'payment', 'guarantee', 'service',
        'tps-', 'imgextra/i1/', 'imgextra/i2/', 'imgextra/i3/', 'imgextra/i4/',
        '-2-tps-', 'O1CN01', '6000000', 'placeholder', 'loading'
    ]

    for keyword in url_blacklist:
        if keyword in src.lower():
            reasons.append(f"URL包含黑名单词: {keyword}")
            break

    # 尺寸检查
    try:
        width = img_element.get_attribute('width')
        height = img_element.get_attribute('height')

        if width and height:
            w, h = int(width), int(height)
            if w < 100 or h < 100:
                reasons.append(f"尺寸太小: {w}x{h}")
            if w/h > 5 or h/w > 5:
                reasons.append(f"比例异常: {w}x{h}")
    except:
        pass

    # CSS类名检查
    img_class = img_element.get_attribute('class') or ''
    class_blacklist = [
        'icon', 'logo', 'avatar', 'badge', 'tag', 'button',
        'service', 'guarantee', 'shipping', 'payment'
    ]

    for keyword in class_blacklist:
        if keyword in img_class.lower():
            reasons.append(f"类名包含: {keyword}")
            break

    # 路径白名单检查
    product_patterns = [
        'bao/uploaded',
        'fleamarket',
        'mtopupload'
    ]

    if not any(pattern in src for pattern in product_patterns):
        reasons.append("不在商品路径白名单中")

    # 参数检查
    small_sizes = ['_48.', '_84.', '_96.', '_110.']
    for size in small_sizes:
        if size in src:
            reasons.append(f"包含小尺寸参数: {size}")
            break

    return reasons

if __name__ == "__main__":
    debug_product_images()