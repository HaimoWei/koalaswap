// app.config.ts
// 功能：把后端地址注入到 Expo "extra" 里，代码中可通过 Constants 读取。
// 你现在本机联调，使用 local profile 端口 12649 / 12648。

import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
    name: "KoalaSwap",
    slug: "koalaswap",
    scheme: "koalaswap",
    extra: {
        // 将来联调再把地址改成 10.0.2.2（Android 模拟器访问宿主机）
        USER_API_BASE_URL: "http://10.0.2.2:12649",
        PRODUCT_API_BASE_URL: "http://10.0.2.2:12648",
        ORDER_API_BASE_URL: "http://10.0.2.2:12650",
        REVIEW_API_BASE_URL: "http://10.0.2.2:12651",
        CHAT_API_BASE_URL: "http://10.0.2.2:12652",
        // 👇 新增：离线开发开关
        USE_MOCKS: false,
    },
};

export default config;
