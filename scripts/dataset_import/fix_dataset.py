#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
数据集修复脚本 - 修复发现的数据问题
"""

import json
import os
import random
import re

def fix_user_names():
    """修复用户缺失的first_name和last_name字段"""
    print("=== 修复用户姓名字段 ===")

    with open('dataset/users_complete.json', 'r', encoding='utf-8') as f:
        users = json.load(f)

    print(f"处理 {len(users)} 个用户...")

    for user in users:
        if 'display_name' in user and user['display_name']:
            # 拆分display_name为first_name和last_name
            name_parts = user['display_name'].strip().split(' ')

            if len(name_parts) >= 2:
                user['first_name'] = name_parts[0]
                user['last_name'] = ' '.join(name_parts[1:])
            else:
                # 只有一个名字的情况
                user['first_name'] = name_parts[0] if name_parts else user['username']
                user['last_name'] = "User"
        else:
            # 没有display_name的情况，使用username
            user['first_name'] = user.get('username', 'Unknown')
            user['last_name'] = "User"

    # 保存修复后的用户数据
    with open('dataset/users_complete_fixed.json', 'w', encoding='utf-8') as f:
        json.dump(users, f, ensure_ascii=False, indent=2)

    print(f"✓ 用户姓名字段已修复，保存到 users_complete_fixed.json")
    return users

def fix_product_prices():
    """修复产品价格异常"""
    print("\n=== 修复产品价格异常 ===")

    with open('dataset/products_complete.json', 'r', encoding='utf-8') as f:
        products = json.load(f)

    print(f"处理 {len(products)} 个产品...")

    fixed_count = 0

    for i, product in enumerate(products):
        price = product.get('price', 0)

        # 修复价格为0的产品
        if price == 0:
            # 根据产品类型设置合理价格
            if 'iphone' in product.get('title', '').lower() or 'iPhone' in product.get('title', ''):
                product['price'] = random.randint(300, 1200)
            elif '相机' in product.get('title', '') or 'camera' in product.get('title', '').lower():
                product['price'] = random.randint(200, 2000)
            elif '化妆品' in product.get('title', '') or '护肤' in product.get('title', ''):
                product['price'] = random.randint(20, 200)
            else:
                product['price'] = random.randint(50, 500)
            fixed_count += 1

        # 修复价格过高的产品 (>10000)
        elif price > 10000:
            # 将过高价格调整到合理范围
            if price > 100000:  # 超过10万的价格明显错误
                product['price'] = random.randint(500, 3000)
            else:
                # 将价格除以适当的倍数
                product['price'] = min(price // 10, 5000)
            fixed_count += 1

    # 保存修复后的产品数据
    with open('dataset/products_complete_fixed.json', 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=2)

    print(f"✓ 产品价格已修复，修复了 {fixed_count} 个产品")
    print(f"✓ 保存到 products_complete_fixed.json")

    # 显示修复后的价格统计
    prices = [p['price'] for p in products]
    print(f"修复后价格范围: ${min(prices)} - ${max(prices)} AUD")
    print(f"修复后平均价格: ${sum(prices)/len(prices):.2f} AUD")

    return products

def validate_fixed_data():
    """验证修复后的数据"""
    print("\n=== 验证修复后的数据 ===")

    # 验证用户数据
    with open('dataset/users_complete_fixed.json', 'r', encoding='utf-8') as f:
        users = json.load(f)

    missing_user_fields = 0
    for user in users:
        if not user.get('first_name') or not user.get('last_name'):
            missing_user_fields += 1

    print(f"用户缺失姓名字段: {missing_user_fields} 个")

    # 验证产品数据
    with open('dataset/products_complete_fixed.json', 'r', encoding='utf-8') as f:
        products = json.load(f)

    zero_prices = sum(1 for p in products if p.get('price', 0) == 0)
    high_prices = sum(1 for p in products if p.get('price', 0) > 10000)

    print(f"价格为0的产品: {zero_prices} 个")
    print(f"价格过高(>10000)的产品: {high_prices} 个")

    if missing_user_fields == 0 and zero_prices == 0 and high_prices == 0:
        print("\n🎉 所有数据问题已修复!")
        return True
    else:
        print("\n⚠️ 仍有数据问题需要处理")
        return False

def backup_and_replace():
    """备份原文件并替换为修复版本"""
    print("\n=== 备份并替换数据文件 ===")

    import shutil
    from datetime import datetime

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # 备份原文件
    shutil.copy('dataset/products_complete.json', f'dataset/products_complete_backup_{timestamp}.json')
    shutil.copy('dataset/users_complete.json', f'dataset/users_complete_backup_{timestamp}.json')

    # 替换为修复版本
    shutil.copy('dataset/products_complete_fixed.json', 'dataset/products_complete.json')
    shutil.copy('dataset/users_complete_fixed.json', 'dataset/users_complete.json')

    print(f"✓ 原文件已备份为 *_backup_{timestamp}.json")
    print("✓ 修复版本已替换原文件")

def main():
    """主修复函数"""
    print("开始修复数据集问题...")

    # 切换到项目根目录
    os.chdir(os.path.dirname(os.path.dirname(__file__)))

    # 修复用户姓名字段
    fix_user_names()

    # 修复产品价格
    fix_product_prices()

    # 验证修复结果
    if validate_fixed_data():
        # 备份并替换原文件
        backup_and_replace()
        print("\n" + "="*60)
        print("🎉 数据集修复完成!")
        print("✓ 用户姓名字段已补全")
        print("✓ 产品价格异常已修复")
        print("✓ 数据准备好导入数据库")
        print("="*60)
    else:
        print("\n❌ 修复过程中出现问题，请检查")

if __name__ == "__main__":
    main()