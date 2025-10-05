#!/usr/bin/env python3
"""
更新种子数据卖家昵称脚本
将 Seed-Seller+XXXXXX 格式的昵称替换为更真实的中文昵称
"""

import random
import psycopg2
from typing import List

# 数据库配置
DB_CONFIG = {
    'host': 'localhost',
    'port': 15433,
    'database': 'koalaswap_dev',
    'user': 'koalaswap',
    'password': 'secret'
}

# 真实中文昵称库
REALISTIC_NAMES = [
    # 常见中文名字组合
    "小明", "小红", "小李", "小王", "小张", "小刘", "小陈", "小林",
    "阿强", "阿军", "阿华", "阿峰", "阿辉", "阿飞", "阿涛", "阿斌",
    "晓东", "晓雯", "晓丽", "晓燕", "晓芳", "晓敏", "晓君", "晓华",
    "志强", "志明", "志华", "志伟", "志勇", "志刚", "志超", "志鹏",
    "美丽", "美华", "美玲", "美琳", "美娜", "美霞", "美英", "美凤",
    "建国", "建华", "建军", "建平", "建波", "建民", "建成", "建东",
    "海燕", "海霞", "海峰", "海涛", "海龙", "海军", "海英", "海华",
    "春花", "春燕", "春霞", "春梅", "春兰", "春雨", "春晓", "春芳",
    # 现代化昵称
    "阳光少年", "梦想飞翔", "清风徐来", "星空漫步", "雨后彩虹",
    "温暖阳光", "微风细雨", "花开半夏", "时光倒流", "岁月如歌",
    "青春无悔", "梦回唐朝", "诗和远方", "云淡风轻", "静水深流",
    "繁花似锦", "岁月静好", "温柔如水", "淡然如菊", "优雅如兰",
    # 地名+形容词组合
    "北京小伙", "上海姑娘", "广州靓仔", "深圳白领", "杭州小哥",
    "成都美女", "武汉大叔", "西安小妹", "南京才子", "苏州佳人",
    "厦门海风", "青岛啤酒", "大连海鸥", "沈阳老铁", "哈尔滨雪花",
    # 兴趣爱好类
    "爱读书的猫", "喜欢音乐", "摄影爱好者", "旅行达人", "美食专家",
    "运动健将", "电影迷", "游戏高手", "数码控", "时尚达人",
    "文艺青年", "技术宅", "咖啡控", "茶叶专家", "收藏家",
    # 可爱昵称
    "小可爱", "大宝贝", "萌萌哒", "甜甜圈", "棉花糖",
    "小太阳", "月亮船", "星星糖", "彩虹糖", "泡泡糖",
    "小兔子", "小熊猫", "小狮子", "小老虎", "小企鹅",
]

class SellerNameUpdater:
    def __init__(self):
        self.conn = psycopg2.connect(**DB_CONFIG)
        self.cursor = self.conn.cursor()
        self.used_names = set()

    def get_seed_sellers(self) -> List[tuple]:
        """获取所有种子卖家（昵称包含Seed-Seller）"""
        self.cursor.execute("""
            SELECT id, display_name, email
            FROM users
            WHERE display_name LIKE 'Seed-Seller%'
            OR display_name LIKE 'seed-seller%'
            ORDER BY created_at
        """)
        return self.cursor.fetchall()

    def generate_unique_name(self) -> str:
        """生成唯一的真实昵称"""
        max_attempts = 100
        for _ in range(max_attempts):
            base_name = random.choice(REALISTIC_NAMES)

            # 30%的概率加数字后缀
            if random.random() < 0.3:
                suffix = random.randint(1, 999)
                name = f"{base_name}{suffix}"
            else:
                name = base_name

            if name not in self.used_names:
                self.used_names.add(name)
                return name

        # 如果都用完了，生成带随机数的名字
        base_name = random.choice(REALISTIC_NAMES)
        suffix = random.randint(1000, 9999)
        name = f"{base_name}{suffix}"
        self.used_names.add(name)
        return name

    def preview_changes(self, limit: int = 20):
        """预览昵称更改"""
        sellers = self.get_seed_sellers()

        print(f"找到 {len(sellers)} 个种子卖家需要更新昵称")
        print(f"预览前 {min(limit, len(sellers))} 个更改：")
        print("=" * 80)

        for i, (user_id, old_name, email) in enumerate(sellers[:limit]):
            new_name = self.generate_unique_name()
            print(f"{i+1:2d}. {user_id}")
            print(f"    原昵称: {old_name}")
            print(f"    新昵称: {new_name}")
            print(f"    邮箱: {email}")
            print()

        if len(sellers) > limit:
            print(f"... 还有 {len(sellers) - limit} 个卖家需要更新")

        return len(sellers)

    def update_all_names(self):
        """执行批量昵称更新"""
        sellers = self.get_seed_sellers()

        if not sellers:
            print("没有找到需要更新的种子卖家昵称")
            return

        print(f"开始更新 {len(sellers)} 个卖家昵称...")

        updated_count = 0
        failed_count = 0

        for user_id, old_name, email in sellers:
            try:
                new_name = self.generate_unique_name()

                self.cursor.execute("""
                    UPDATE users
                    SET display_name = %s, updated_at = NOW()
                    WHERE id = %s
                """, (new_name, user_id))

                updated_count += 1

                if updated_count % 50 == 0:
                    print(f"已更新 {updated_count} 个昵称...")

            except Exception as e:
                print(f"更新用户 {user_id} 失败: {e}")
                failed_count += 1

        # 提交更改
        self.conn.commit()

        print(f"\n昵称更新完成!")
        print(f"成功更新: {updated_count} 个")
        print(f"失败: {failed_count} 个")

    def close(self):
        """关闭数据库连接"""
        self.cursor.close()
        self.conn.close()

def main():
    updater = SellerNameUpdater()

    try:
        # 预览更改
        total_count = updater.preview_changes()

        if total_count == 0:
            return

        print("=" * 80)
        choice = input(f"是否执行昵称更新? (输入 'yes' 确认): ")

        if choice.lower() == 'yes':
            updater.update_all_names()
        else:
            print("操作已取消")

    finally:
        updater.close()

if __name__ == "__main__":
    main()