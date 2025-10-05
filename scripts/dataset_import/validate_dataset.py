#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
数据集验证脚本 - 确保数据准备好导入数据库
"""

import json
import os
from collections import Counter

def validate_products():
    """验证产品数据"""
    print("=== 产品数据验证 ===")

    # 加载产品数据
    with open('dataset/products_complete.json', 'r', encoding='utf-8') as f:
        products = json.load(f)

    print(f"总产品数: {len(products)}")

    # 1. 基本结构检查
    required_fields = ['id', 'title', 'price', 'currency', 'condition', 'category', 'images', 'seller_id']
    missing_fields = []
    invalid_data = []

    for i, product in enumerate(products):
        # 检查必填字段
        for field in required_fields:
            if field not in product or product[field] is None or product[field] == '':
                missing_fields.append(f"Product {i}: missing {field}")

        # 检查价格
        if 'price' in product and not isinstance(product['price'], (int, float)):
            invalid_data.append(f"Product {i}: price not numeric: {product['price']}")

        # 检查图片
        if 'images' in product:
            if not isinstance(product['images'], list):
                invalid_data.append(f"Product {i}: images not array")
            elif len(product['images']) == 0:
                invalid_data.append(f"Product {i}: no images")

    # 2. 数据分布统计
    prices = [p['price'] for p in products if 'price' in p and isinstance(p['price'], (int, float))]
    categories = Counter([p['category'] for p in products if 'category' in p])
    conditions = Counter([p['condition'] for p in products if 'condition' in p])
    keywords = Counter([p['keyword'] for p in products if 'keyword' in p])

    # 3. 图片统计
    total_images = 0
    products_with_multiple_images = 0
    image_files_missing = []

    for i, p in enumerate(products):
        if 'images' in p and isinstance(p['images'], list):
            img_count = len(p['images'])
            total_images += img_count
            if img_count > 1:
                products_with_multiple_images += 1

            # 检查图片文件是否存在
            for img in p['images']:
                if isinstance(img, dict) and 'filename' in img:
                    img_path = f"dataset/images/{img['filename']}"
                    if not os.path.exists(img_path):
                        image_files_missing.append(f"Product {i}: {img['filename']}")

    # 输出结果
    print("\n--- 数据质量检查结果 ---")
    print(f"缺失必填字段: {len(missing_fields)} 个问题")
    print(f"数据格式错误: {len(invalid_data)} 个问题")
    print(f"缺失图片文件: {len(image_files_missing)} 个问题")

    if missing_fields:
        print("\n缺失字段示例:")
        for issue in missing_fields[:3]:
            print(f"  {issue}")

    if invalid_data:
        print("\n格式错误示例:")
        for issue in invalid_data[:3]:
            print(f"  {issue}")

    if image_files_missing:
        print("\n缺失图片示例:")
        for issue in image_files_missing[:3]:
            print(f"  {issue}")

    print("\n--- 数据分布统计 ---")
    if prices:
        print(f"价格范围: ${min(prices)} - ${max(prices)} AUD")
        print(f"平均价格: ${sum(prices)/len(prices):.2f} AUD")

    print(f"\n产品分类分布:")
    for cat, count in categories.most_common():
        print(f"  {cat}: {count} 个")

    print(f"\n产品状态分布:")
    for cond, count in conditions.most_common():
        print(f"  {cond}: {count} 个")

    print(f"\n关键词分布 (前10):")
    for kw, count in keywords.most_common(10):
        print(f"  {kw}: {count} 个")

    print(f"\n图片统计:")
    print(f"  总图片数: {total_images}")
    print(f"  平均每产品: {total_images/len(products):.1f} 张")
    print(f"  多图片产品: {products_with_multiple_images} 个")

    return len(missing_fields) == 0 and len(invalid_data) == 0 and len(image_files_missing) == 0

def validate_users():
    """验证用户数据"""
    print("\n=== 用户数据验证 ===")

    # 加载用户数据
    with open('dataset/users_complete.json', 'r', encoding='utf-8') as f:
        users = json.load(f)

    print(f"总用户数: {len(users)}")

    # 检查必填字段
    required_fields = ['id', 'email', 'username', 'first_name', 'last_name']
    missing_fields = []
    duplicate_emails = []

    emails_seen = set()

    for i, user in enumerate(users):
        # 检查必填字段
        for field in required_fields:
            if field not in user or user[field] is None or user[field] == '':
                missing_fields.append(f"User {i}: missing {field}")

        # 检查邮箱重复
        if 'email' in user:
            if user['email'] in emails_seen:
                duplicate_emails.append(f"User {i}: duplicate email {user['email']}")
            else:
                emails_seen.add(user['email'])

    print(f"\n--- 用户数据质量检查 ---")
    print(f"缺失必填字段: {len(missing_fields)} 个问题")
    print(f"重复邮箱: {len(duplicate_emails)} 个问题")

    if missing_fields:
        print("\n缺失字段示例:")
        for issue in missing_fields[:3]:
            print(f"  {issue}")

    if duplicate_emails:
        print("\n重复邮箱示例:")
        for issue in duplicate_emails[:3]:
            print(f"  {issue}")

    # 显示用户示例
    if users:
        print(f"\n用户数据结构: {list(users[0].keys())}")
        print(f"用户示例:")
        user = users[0]
        for key, value in user.items():
            if isinstance(value, str) and len(value) > 50:
                print(f"  {key}: {value[:50]}...")
            else:
                print(f"  {key}: {value}")

    return len(missing_fields) == 0 and len(duplicate_emails) == 0

def check_database_compatibility():
    """检查与数据库表结构的兼容性"""
    print("\n=== 数据库兼容性检查 ===")

    # 需要检查数据库表结构
    print("提示: 需要查看数据库表结构来验证字段映射")
    print("建议检查项:")
    print("1. product 表的字段是否与 JSON 数据匹配")
    print("2. user 表的字段是否与 JSON 数据匹配")
    print("3. 数据类型是否兼容 (VARCHAR长度, INT范围等)")
    print("4. 外键关系是否正确 (seller_id 对应 user.id)")

def main():
    """主验证函数"""
    print("开始验证数据集...")

    # 切换到项目根目录
    os.chdir(os.path.dirname(os.path.dirname(__file__)))

    # 验证产品数据
    products_valid = validate_products()

    # 验证用户数据
    users_valid = validate_users()

    # 检查数据库兼容性
    check_database_compatibility()

    # 总结
    print("\n" + "="*60)
    print("数据验证总结:")
    print("="*60)

    if products_valid:
        print("✅ 产品数据: 验证通过")
    else:
        print("❌ 产品数据: 存在问题")

    if users_valid:
        print("✅ 用户数据: 验证通过")
    else:
        print("❌ 用户数据: 存在问题")

    if products_valid and users_valid:
        print("\n🎉 数据集验证完成，可以导入数据库!")
    else:
        print("\n⚠️  数据集存在问题，需要修复后再导入")

if __name__ == "__main__":
    main()