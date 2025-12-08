// src/lib/api.ts
// 功能：为各微服务创建 axios 实例；自动加 Authorization；401 时清登录态。

import axios, { AxiosInstance } from "axios";
import * as SecureStore from "expo-secure-store";
import { ENV } from "./env";

export async function getToken() {
    return await SecureStore.getItemAsync("access_token");
}
export async function setToken(t: string) {
    await SecureStore.setItemAsync("access_token", t);
}
export async function clearToken() {
    await SecureStore.deleteItemAsync("access_token");
}

function wireAuth(inst: AxiosInstance) {
    inst.interceptors.request.use(async (config) => {
        const token = await getToken();
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    });
    inst.interceptors.response.use(
        (res) => res,
        async (error) => {
            if (error?.response?.status === 401) {
                await clearToken();
                // 实际跳转登录交由全局 AuthContext 处理
            }
            return Promise.reject(error);
        }
    );
    return inst;
}

// === 各服务 API ===
export const userApi = wireAuth(
    axios.create({ baseURL: ENV.USER_API_BASE_URL })
);
export const productApi = wireAuth(
    axios.create({ baseURL: ENV.PRODUCT_API_BASE_URL })
);
export const orderApi = wireAuth(
    axios.create({ baseURL: ENV.ORDER_API_BASE_URL })
);
export const reviewApi = wireAuth(
    axios.create({ baseURL: ENV.REVIEW_API_BASE_URL })
);
export const chatApi = wireAuth(
    axios.create({ baseURL: ENV.CHAT_API_BASE_URL })
);
