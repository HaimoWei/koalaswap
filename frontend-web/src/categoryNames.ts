// src/categoryNames.ts
// Category name translations (Chinese -> English)

export const CATEGORY_NAME_MAP: Record<string, string> = {
  // Top-level
  "数码电子": "Electronics",
  "生活用品": "Home & living",
  "图书文娱": "Books & entertainment",
  "其他分类": "Other categories",
  "其他": "Other",

  // Second-level
  "手机通讯": "Mobile phones & communication",
  "电脑办公": "Computers & office",
  "数码影音": "Digital audio & video",
  "家用电器": "Home appliances",
  "服装鞋包": "Clothing, shoes & bags",
  "美妆个护": "Beauty & personal care",
  "家居生活": "Home & lifestyle",
  "运动户外": "Sports & outdoors",
  "母婴用品": "Maternity & baby",
  "图书杂志": "Books & magazines",
  "文体用品": "Stationery & arts",
  "游戏娱乐": "Games & entertainment",

  // Third-level
  "智能手机": "Smartphones",
  "手机配件": "Phone accessories",
  "对讲机": "Walkie-talkies",
  "笔记本电脑": "Laptops",
  "台式电脑": "Desktops",
  "平板电脑": "Tablets",
  "电脑配件": "Computer accessories",
  "办公设备": "Office equipment",
  "数码相机": "Digital cameras",
  "摄像设备": "Video cameras",
  "耳机音响": "Headphones & speakers",
  "智能手表": "Smartwatches",
  "无人机": "Drones",
  "大型家电": "Large appliances",
  "小型家电": "Small appliances",
  "厨房电器": "Kitchen appliances",
  "男装": "Men's clothing",
  "女装": "Women's clothing",
  "童装": "Kids' clothing",
  "男鞋": "Men's shoes",
  "女鞋": "Women's shoes",
  "箱包": "Bags & luggage",
  "配饰": "Accessories",
  "护肤品": "Skincare",
  "彩妆": "Makeup",
  "香水": "Perfume",
  "个人护理": "Personal care",
  "家具": "Furniture",
  "家纺用品": "Home textiles",
  "厨房用品": "Kitchenware",
  "收纳整理": "Storage & organization",
  "装饰用品": "Decor",
  "健身器材": "Fitness equipment",
  "运动服饰": "Sportswear",
  "户外用品": "Outdoor gear",
  "运动鞋": "Sports shoes",
  "奶粉辅食": "Formula & baby food",
  "纸尿裤": "Diapers",
  "婴儿用品": "Baby products",
  "儿童玩具": "Kids' toys",
  "小说文学": "Fiction & literature",
  "教育考试": "Education & exams",
  "科技计算机": "Technology & computing",
  "生活时尚": "Lifestyle",
  "杂志期刊": "Magazines",
  "文具用品": "Stationery",
  "乐器": "Musical instruments",
  "绘画用品": "Art supplies",
  "游戏机": "Game consoles",
  "游戏软件": "Game software",
  "桌游卡牌": "Board & card games",
};

export function translateCategoryName(name: string | null | undefined): string {
  if (!name) return "";
  return CATEGORY_NAME_MAP[name] ?? name;
}

