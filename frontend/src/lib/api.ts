// src/lib/api.ts
// 功能：针对 user-service / product-service 各建一个 axios 实例；
// 每次请求自动带上 Authorization；401 时清登录态（后续跳登录）。

import axios from "axios";
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

export const userApi = axios.create({ baseURL: ENV.USER_API_BASE_URL });
export const productApi = axios.create({ baseURL: ENV.PRODUCT_API_BASE_URL });

[userApi, productApi].forEach((inst) => {
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
                // 这里先只清 token；具体“跳转回登录”放到后面的 AuthContext/导航里统一处理
            }
            return Promise.reject(error);
        }
    );
});
