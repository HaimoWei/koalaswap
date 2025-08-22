// src/lib/env.ts
// 功能：从 app.config.ts 注入的 extra 里读取后端地址。

import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra || {}) as any;

export const ENV = {
    USER_API_BASE_URL: String(extra.USER_API_BASE_URL || ""),
    PRODUCT_API_BASE_URL: String(extra.PRODUCT_API_BASE_URL || ""),
    ORDER_API_BASE_URL: String(extra.ORDER_API_BASE_URL || ""),
    USE_MOCKS: !!extra.USE_MOCKS,
};