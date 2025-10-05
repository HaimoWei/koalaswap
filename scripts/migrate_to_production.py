#!/usr/bin/env python3
"""
生产环境数据迁移脚本
支持数据库备份和图片文件迁移
"""

import os
import subprocess
import sys
from pathlib import Path
from datetime import datetime

# 迁移配置
LOCAL_DB_CONFIG = {
    'host': 'localhost',
    'port': '15433',
    'user': 'koalaswap',
    'database': 'koalaswap_dev',
    'container': 'koalaswap-pg'
}

PROD_DB_CONFIG = {
    'host': 'your-prod-db-host',
    'port': '5432',
    'user': 'koalaswap',
    'database': 'koalaswap_prod'
}

def create_db_backup():
    """创建数据库备份"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = f"koalaswap_backup_{timestamp}.sql"

    print(f"正在创建数据库备份: {backup_file}")

    # 使用 Docker 执行 pg_dump
    cmd = [
        'docker', 'exec', LOCAL_DB_CONFIG['container'],
        'pg_dump',
        '-U', LOCAL_DB_CONFIG['user'],
        '-d', LOCAL_DB_CONFIG['database'],
        '-f', f'/tmp/{backup_file}'
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"备份失败: {result.stderr}")
        return None

    # 复制到主机
    copy_cmd = ['docker', 'cp', f"{LOCAL_DB_CONFIG['container']}:/tmp/{backup_file}", f"./{backup_file}"]
    result = subprocess.run(copy_cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"复制备份文件失败: {result.stderr}")
        return None

    print(f"✅ 数据库备份成功: {backup_file}")
    return backup_file

def restore_to_production(backup_file, prod_host, prod_user, prod_db):
    """恢复到生产数据库"""
    print(f"正在恢复数据到生产数据库: {prod_host}")

    cmd = [
        'psql',
        '-h', prod_host,
        '-U', prod_user,
        '-d', prod_db,
        '-f', backup_file
    ]

    # 注意：这需要在有 psql 客户端的环境中执行
    print(f"请在生产服务器上执行以下命令:")
    print(f"psql -h {prod_host} -U {prod_user} -d {prod_db} -f {backup_file}")

def sync_s3_images():
    """同步S3图片文件"""
    print("正在同步S3图片文件...")

    # 读取当前S3配置
    current_bucket = os.getenv('S3_BUCKET', 'koalaswap')
    prod_bucket = os.getenv('PROD_S3_BUCKET', 'koalaswap-prod')

    if current_bucket == prod_bucket:
        print("⚠️  源和目标S3 bucket相同，跳过同步")
        return

    cmd = [
        'aws', 's3', 'sync',
        f's3://{current_bucket}',
        f's3://{prod_bucket}',
        '--exclude', '*.tmp',
        '--delete'
    ]

    print(f"执行命令: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode == 0:
        print(f"✅ S3图片同步成功")
        print(f"   从: s3://{current_bucket}")
        print(f"   到: s3://{prod_bucket}")
    else:
        print(f"❌ S3同步失败: {result.stderr}")

def generate_env_config():
    """生成生产环境配置"""
    prod_env = f"""
# 生产环境配置 (.env.prod)
# 数据库配置
DATABASE_URL=jdbc:postgresql://{PROD_DB_CONFIG['host']}:{PROD_DB_CONFIG['port']}/{PROD_DB_CONFIG['database']}
DATABASE_USERNAME={PROD_DB_CONFIG['user']}
DATABASE_PASSWORD=your-prod-password

# S3配置 (使用生产bucket)
S3_BUCKET=koalaswap-prod
CDN_BASE=https://your-prod-cdn.cloudfront.net
AWS_ACCESS_KEY_ID=your-prod-key
AWS_SECRET_ACCESS_KEY=your-prod-secret
AWS_REGION=your-prod-region

# API配置
KOALASWAP_API_BASE=https://your-prod-domain.com

# 邮件配置 (生产环境)
MAIL_HOST=your-smtp-host
MAIL_USERNAME=your-email@domain.com
MAIL_PASSWORD=your-email-password
ADMIN_EMAIL=admin@your-domain.com

# 其他生产配置
SPRING_PROFILES_ACTIVE=prod
LOG_LEVEL=INFO
"""

    with open('.env.prod', 'w') as f:
        f.write(prod_env)

    print("✅ 生产环境配置文件已生成: .env.prod")

def print_migration_checklist():
    """打印迁移检查清单"""
    print("\n" + "="*60)
    print("🚀 生产环境迁移检查清单")
    print("="*60)

    checklist = [
        "✓ 数据库备份已创建",
        "□ 生产数据库已创建并配置",
        "□ 备份文件已上传到生产服务器",
        "□ 数据已恢复到生产数据库",
        "□ S3 bucket已配置并同步图片",
        "□ 生产环境变量已配置",
        "□ 应用已部署到生产服务器",
        "□ 域名和SSL证书已配置",
        "□ 负载均衡和监控已设置",
        "□ 数据迁移验证完成"
    ]

    for item in checklist:
        print(f"  {item}")

    print("\n📝 重要提醒:")
    print("  1. 备份前先暂停应用写入操作")
    print("  2. 生产环境使用不同的密码和密钥")
    print("  3. 配置生产级别的监控和日志")
    print("  4. 测试所有功能是否正常工作")

def main():
    print("🔄 KoalaSwap 生产环境迁移工具")
    print("-" * 40)

    if len(sys.argv) > 1:
        action = sys.argv[1]
    else:
        print("请选择操作:")
        print("1. backup - 创建数据库备份")
        print("2. sync-s3 - 同步S3图片")
        print("3. gen-config - 生成生产配置")
        print("4. all - 执行所有操作")
        action = input("请输入选择 (1-4): ").strip()

        action_map = {'1': 'backup', '2': 'sync-s3', '3': 'gen-config', '4': 'all'}
        action = action_map.get(action, action)

    if action in ['backup', 'all']:
        backup_file = create_db_backup()
        if backup_file:
            restore_to_production(backup_file,
                                PROD_DB_CONFIG['host'],
                                PROD_DB_CONFIG['user'],
                                PROD_DB_CONFIG['database'])

    if action in ['sync-s3', 'all']:
        sync_s3_images()

    if action in ['gen-config', 'all']:
        generate_env_config()

    if action == 'all':
        print_migration_checklist()

if __name__ == "__main__":
    main()