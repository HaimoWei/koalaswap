// src/api/http.ts
import axios from "axios";
import { useAuthStore } from "../store/auth";
import { DEBUG, dlog } from "../debug";

// 允许每个服务单独设置；没配时退化到 window.origin（一般不走）
function pickBase(key: string) {
    const v = (import.meta as any).env[key];
    return v || window.location.origin;
}

function createApi(baseURL: string) {
    const instance = axios.create({ baseURL, withCredentials: false });

    instance.interceptors.request.use((config) => {
        const token = useAuthStore.getState().token;
        if (token) config.headers.Authorization = `Bearer ${token}`;
        if (DEBUG) {
            dlog("HTTP ▶︎ Request", {
                baseURL: config.baseURL,
                url: config.url,
                method: config.method,
                params: config.params,
                data: config.data,
            });
        }
        return config;
    });

    instance.interceptors.response.use(
        (res) => {
            if (DEBUG) {
                dlog("HTTP ◀︎ Response", {
                    url: res.config?.url,
                    status: res.status,
                    data: res.data,
                });
            }
            return res;
        },
        (err) => {
            if (DEBUG) {
                dlog("HTTP ✖︎ Error", {
                    url: err.config?.url,
                    status: err.response?.status,
                    data: err.response?.data,
                    message: err.message,
                });
            }
            if (err?.response?.status === 401) {
                useAuthStore.getState().clear();
            }
            return Promise.reject(err);
        }
    );

    return instance;
}

export const userApi    = createApi(pickBase("VITE_USER_API_BASE_URL"));
export const productApi = createApi(pickBase("VITE_PRODUCT_API_BASE_URL"));
export const orderApi   = createApi(pickBase("VITE_ORDER_API_BASE_URL"));
export const reviewApi  = createApi(pickBase("VITE_REVIEW_API_BASE_URL"));
export const chatApi    = createApi(pickBase("VITE_CHAT_API_BASE_URL"));
