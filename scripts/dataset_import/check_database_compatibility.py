#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json

def check_database_compatibility():
    """检查数据与数据库表结构的兼容性"""
    print("=== Database Compatibility Check ===")

    # 加载数据
    with open('dataset/products_complete.json', 'r', encoding='utf-8') as f:
        products = json.load(f)

    with open('dataset/users_complete.json', 'r', encoding='utf-8') as f:
        users = json.load(f)

    print("\n--- Products Table Mapping ---")

    # 检查产品数据映射
    sample_product = products[0] if products else {}

    # 数据库表字段映射
    product_field_mapping = {
        'id': 'id (UUID)',  # 需要转换为UUID
        'title': 'title (VARCHAR(200))',
        'description': 'description (TEXT)',
        'price': 'price (NUMERIC(10,2))',
        'currency': 'currency (VARCHAR(10))',
        'condition': 'condition (product_condition ENUM)',  # 需要映射
        'category': 'category_id (INT)',  # 需要映射到分类ID
        'seller_id': 'seller_id (UUID)',  # 需要转换为UUID
        'images': 'product_images table',  # 需要单独处理
        'created_at': 'created_at (TIMESTAMP)',
    }

    print("Product field mapping check:")
    issues = []

    for json_field, db_field in product_field_mapping.items():
        if json_field in sample_product:
            value = sample_product[json_field]
            print(f"  ✓ {json_field} -> {db_field}")

            # 检查具体的数据兼容性
            if json_field == 'condition':
                # 检查condition值是否符合枚举
                valid_conditions = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']
                if value in valid_conditions:
                    print(f"    ✓ Condition '{value}' is valid")
                else:
                    issues.append(f"Invalid condition: {value}")

            elif json_field == 'category':
                # 检查分类
                if value == 'Smart Phones':
                    print(f"    ! Category '{value}' needs mapping to category_id")
                    print(f"      Suggested: 1011 (智能手机)")

            elif json_field == 'price':
                # 检查价格
                if isinstance(value, (int, float)) and value >= 0:
                    print(f"    ✓ Price ${value} is valid")
                else:
                    issues.append(f"Invalid price: {value}")
        else:
            issues.append(f"Missing field: {json_field}")

    print("\n--- Users Table Mapping ---")

    sample_user = users[0] if users else {}

    user_field_mapping = {
        'id': 'id (UUID)',
        'email': 'email (VARCHAR(320))',
        'username': 'display_name (VARCHAR(120))',  # username -> display_name
        'first_name': 'first_name (新增字段)',
        'last_name': 'last_name (新增字段)',
        'bio': 'bio (TEXT)',
        'location': 'location (VARCHAR(100))',
        'rating_avg': 'rating_avg (NUMERIC(2,1))',
        'rating_count': 'rating_count (INT)',
        'member_since': 'member_since (DATE)',
        'phone_verified': 'phone_verified (BOOLEAN)',
        'email_verified': 'email_verified (BOOLEAN)',
    }

    print("User field mapping check:")

    for json_field, db_field in user_field_mapping.items():
        if json_field in sample_user:
            value = sample_user[json_field]
            print(f"  ✓ {json_field} -> {db_field}")

            # 检查具体的数据兼容性
            if json_field == 'email':
                if '@' in str(value) and len(str(value)) <= 320:
                    print(f"    ✓ Email format valid")
                else:
                    issues.append(f"Invalid email: {value}")

            elif json_field == 'rating_avg':
                if isinstance(value, (int, float)) and 0 <= value <= 5:
                    print(f"    ✓ Rating {value} is valid")
                else:
                    issues.append(f"Invalid rating: {value}")
        else:
            issues.append(f"Missing user field: {json_field}")

    print("\n--- Missing Database Fields ---")

    # 数据库必需但JSON中缺失的字段
    missing_product_fields = [
        'password_hash',  # 用户需要密码
        'status',  # 产品需要状态 (ACTIVE/RESERVED/SOLD/HIDDEN)
    ]

    print("Fields that need to be generated during import:")
    for field in missing_product_fields:
        print(f"  ! {field} - needs default value")

    print("\n--- Data Import Strategy ---")
    print("Recommended import approach:")
    print("1. Users:")
    print("   - Generate UUID for id")
    print("   - Generate default password_hash")
    print("   - Map username to display_name")
    print("   - Convert member_since to DATE format")

    print("2. Product Categories:")
    print("   - Map 'Smart Phones' to category_id = 1011")

    print("3. Products:")
    print("   - Generate UUID for id and seller_id")
    print("   - Set status = 'ACTIVE'")
    print("   - Map condition values to enum")
    print("   - Map seller_id to user UUID")

    print("4. Product Images:")
    print("   - Create separate records in product_images table")
    print("   - Set is_primary = TRUE for first image")
    print("   - Set display_order = 0, 1, 2...")
    print("   - Set upload_status = 'COMPLETED'")

    if issues:
        print(f"\n--- Issues Found ({len(issues)}) ---")
        for issue in issues:
            print(f"  ❌ {issue}")
        return False
    else:
        print("\n✅ Database compatibility check passed!")
        return True

if __name__ == "__main__":
    check_database_compatibility()