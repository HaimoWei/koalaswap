#!/usr/bin/env python3
"""
更新英文用户名脚本
将重复的、看起来像bot的英文用户名更新为更多样化、真实的英文用户名
"""

import random
import psycopg2
from typing import List, Dict, Set

# 数据库配置
DB_CONFIG = {
    'host': 'localhost',
    'port': 15433,
    'database': 'koalaswap_dev',
    'user': 'koalaswap',
    'password': 'secret'
}

# 真实的英文名字库
REALISTIC_ENGLISH_NAMES = [
    # 男性名字
    "Alexander Johnson", "Benjamin Parker", "Christopher Taylor", "Daniel Wilson", "Ethan Brown",
    "Felix Martinez", "Gabriel Anderson", "Henry Thompson", "Isaac Garcia", "Jacob Rodriguez",
    "Kevin Lewis", "Logan Walker", "Matthew Hall", "Nathan Young", "Oliver King",
    "Patrick Wright", "Quinn Lopez", "Ryan Hill", "Samuel Green", "Thomas Adams",
    "Ulysses Baker", "Victor Nelson", "William Carter", "Xavier Mitchell", "Zachary Turner",
    "Adrian Phillips", "Brian Campbell", "Connor Evans", "Dylan Edwards", "Evan Collins",
    "Frank Stewart", "George Sanchez", "Harrison Morris", "Ian Rogers", "Jason Reed",
    "Kyle Cook", "Lucas Bailey", "Marcus Rivera", "Nicholas Cooper", "Oscar Richardson",
    "Peter Cox", "Robert Ward", "Sebastian Torres", "Tyler Peterson", "Vincent Gray",
    "Wesley Ramirez", "Xander James", "Yusuf Watson", "Zane Brooks", "Aaron Powell",

    # 女性名字
    "Abigail Foster", "Bella Hughes", "Charlotte Price", "Diana Bennett", "Emma Wood",
    "Fiona Ross", "Grace Henderson", "Hannah Coleman", "Isabella Jenkins", "Julia Perry",
    "Katherine Powell", "Luna Butler", "Madison Barnes", "Natalie Fisher", "Olivia Griffin",
    "Penelope Washington", "Quinn Murphy", "Rachel Russell", "Sophia Diaz", "Taylor Hayes",
    "Uma Alexander", "Victoria Sanders", "Willow Patel", "Ximena Long", "Yasmine Patterson",
    "Zoe Hughes", "Alice Cooper", "Brooke Kelly", "Chloe Howard", "Delilah Ward",
    "Eleanor Cruz", "Freya Gonzalez", "Georgia Myers", "Haley Butler", "Iris Moore",
    "Jade Roberts", "Kendall Bell", "Layla Rivera", "Maya Torres", "Nora Parker",
    "Ophelia Scott", "Piper Green", "Ruby Adams", "Stella Nelson", "Tessa Baker",
    "Ursula White", "Vera Thompson", "Whitney Davis", "Xara Martinez", "Yara Johnson",

    # 特殊/国际化名字
    "Alejandro Morales", "Amara Singh", "Aria Patel", "Axel Johansson", "Camila Silva",
    "Diego Herrera", "Elena Volkov", "Francesco Romano", "Gabriela Santos", "Hassan Ali",
    "Ingrid Larsson", "Jasmine Kim", "Kai Chen", "Liam O'Connor", "Mia Rodriguez",
    "Noah Andersen", "Priya Sharma", "Rafael Costa", "Sofia Petrov", "Theo Williams",
    "Valentina Rossi", "Wei Zhang", "Zara Ahmed", "Marco Bianchi", "Aria Nakamura",

    # 现代风格名字
    "Aiden Cross", "Blake Hunter", "Cameron Reed", "Drew Phoenix", "Emery Stone",
    "Finley Rivers", "Gray Mitchell", "Harlow Knight", "Indie Vale", "Jaxon Storm",
    "Kai Brooks", "Lane Fox", "Memphis Cole", "Nova Sterling", "Orion Sage",
    "Phoenix Lane", "Quinn Archer", "Ryder West", "Sage Wilde", "Tate Rivers",
    "Urban Blake", "Vale Cross", "Wren Stone", "Zara Moon", "Atlas Reed",

    # 传统但不常见的名字
    "Adelaide Clarke", "Benedict Shaw", "Cordelia Wright", "Daphne Mills", "Edmund Foster",
    "Florence Webb", "Gideon Blake", "Hermione Cross", "Ignatius Stone", "Josephine Vale",
    "Lysander Moon", "Magnolia Reed", "Nathaniel Rivers", "Octavia Sage", "Percival Knight",
    "Quincy Wilde", "Rosalind Hunter", "Sebastian Cross", "Theodora Blake", "Ulysses Stone"
]

class EnglishUsernameUpdater:
    def __init__(self):
        self.conn = psycopg2.connect(**DB_CONFIG)
        self.cursor = self.conn.cursor()
        self.used_names = set()

    def get_duplicate_english_users(self) -> List[tuple]:
        """获取需要更新的用户名（包括中文bot风格用户名）"""
        self.cursor.execute("""
            SELECT id, email, display_name
            FROM users
            WHERE display_name ~ '[\u4e00-\u9fff]'  -- 包含中文字符的用户名
            OR display_name IN (
                SELECT display_name
                FROM users
                WHERE display_name ~ '^[A-Za-z]+ [A-Za-z]+$'
                AND display_name NOT LIKE '%中%'
                AND display_name NOT LIKE '%汉%'
                AND display_name NOT LIKE '%@%'
                GROUP BY display_name
                HAVING COUNT(*) > 1
            )
            OR display_name IN (
                'Michael Moore', 'Michael Miller', 'Michael Jones', 'Michael Garcia',
                'Lisa Miller', 'Lisa Johnson', 'Lisa Davis', 'Kate Williams',
                'Kate Miller', 'Kate Garcia', 'Kate Davis', 'John Jones',
                'John Garcia', 'John Davis', 'Emma Smith', 'David Wilson',
                'Sarah Johnson', 'James Brown', 'Mary Davis', 'Robert Miller'
            )
            ORDER BY created_at
        """)
        return self.cursor.fetchall()

    def get_existing_display_names(self) -> Set[str]:
        """获取已存在的display_name"""
        self.cursor.execute("SELECT display_name FROM users")
        return {row[0] for row in self.cursor.fetchall()}

    def generate_unique_name(self, existing_names: Set[str]) -> str:
        """生成唯一的真实英文名"""
        max_attempts = 200
        for _ in range(max_attempts):
            name = random.choice(REALISTIC_ENGLISH_NAMES)

            # 30%的概率添加数字后缀使名字更独特
            if random.random() < 0.3:
                suffix = random.randint(1, 99)
                name_with_suffix = f"{name}{suffix}"
                if name_with_suffix not in existing_names and name_with_suffix not in self.used_names:
                    self.used_names.add(name_with_suffix)
                    existing_names.add(name_with_suffix)
                    return name_with_suffix

            if name not in existing_names and name not in self.used_names:
                self.used_names.add(name)
                existing_names.add(name)
                return name

        # 如果都用完了，生成带随机数的名字
        base_name = random.choice(REALISTIC_ENGLISH_NAMES)
        suffix = random.randint(100, 999)
        name = f"{base_name}{suffix}"
        self.used_names.add(name)
        existing_names.add(name)
        return name

    def preview_changes(self, limit: int = 30):
        """预览用户名更改"""
        users = self.get_duplicate_english_users()
        existing_names = self.get_existing_display_names()

        print(f"找到 {len(users)} 个需要更新用户名的用户（包括中文bot风格用户名）")
        print(f"预览前 {min(limit, len(users))} 个更改：")
        print("=" * 100)

        for i, (user_id, email, old_name) in enumerate(users[:limit]):
            new_name = self.generate_unique_name(existing_names)
            print(f"{i+1:2d}. {user_id}")
            print(f"    邮箱: {email}")
            print(f"    原用户名: {old_name}")
            print(f"    新用户名: {new_name}")
            print()

        if len(users) > limit:
            print(f"... 还有 {len(users) - limit} 个用户需要更新")

        return len(users)

    def update_all_usernames(self):
        """执行批量用户名更新"""
        users = self.get_duplicate_english_users()
        existing_names = self.get_existing_display_names()

        if not users:
            print("没有找到需要更新的bot风格用户名")
            return

        print(f"开始更新 {len(users)} 个用户的用户名...")

        updated_count = 0
        failed_count = 0

        for user_id, email, old_name in users:
            try:
                new_name = self.generate_unique_name(existing_names)

                self.cursor.execute("""
                    UPDATE users
                    SET display_name = %s, updated_at = NOW()
                    WHERE id = %s
                """, (new_name, user_id))

                updated_count += 1

                if updated_count % 50 == 0:
                    print(f"已更新 {updated_count} 个用户名...")

            except Exception as e:
                print(f"更新用户 {user_id} 失败: {e}")
                failed_count += 1

        # 提交更改
        self.conn.commit()

        print(f"\n用户名更新完成!")
        print(f"成功更新: {updated_count} 个")
        print(f"失败: {failed_count} 个")

        # 显示更新后的统计
        self.cursor.execute("""
            SELECT display_name, COUNT(*)
            FROM users
            WHERE display_name ~ '^[A-Za-z]+ [A-Za-z]+[0-9]*$'
            GROUP BY display_name
            HAVING COUNT(*) > 1
            ORDER BY COUNT(*) DESC
            LIMIT 10
        """)

        remaining_duplicates = self.cursor.fetchall()
        if remaining_duplicates:
            print(f"\n剩余重复用户名:")
            for name, count in remaining_duplicates:
                print(f"  {name}: {count} 个")
        else:
            print(f"\n✅ 所有重复的英文用户名已成功更新!")

    def close(self):
        """关闭数据库连接"""
        self.cursor.close()
        self.conn.close()

def main():
    updater = EnglishUsernameUpdater()

    try:
        # 预览更改
        total_count = updater.preview_changes()

        if total_count == 0:
            return

        print("=" * 100)
        choice = input(f"是否执行用户名更新? (输入 'yes' 确认): ")

        if choice.lower() == 'yes':
            updater.update_all_usernames()
        else:
            print("操作已取消")

    finally:
        updater.close()

if __name__ == "__main__":
    main()