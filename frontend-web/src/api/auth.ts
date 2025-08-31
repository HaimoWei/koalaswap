import { userApi } from "./http";
import type { ApiResponse, LoginRes, MyProfileRes } from "./types";

// 登录
export async function login(email: string, password: string) {
    const { data } = await userApi.post<ApiResponse<LoginRes>>(
        "/api/auth/login",
        { email, password }
    );
    if (!data.ok || !data.data) throw new Error(data.message || "Login failed");
    return data.data;
}

// 注册
export async function register(payload: {
    email: string;
    password: string;
    displayName: string;
}) {
    const { data } = await userApi.post<ApiResponse<MyProfileRes>>(
        "/api/auth/register",
        payload
    );
    if (!data.ok || !data.data) throw new Error(data.message || "Register failed");
    return data.data;
}

// 退出（可选，后端若需要）
export async function logout() {
    const { data } = await userApi.post<ApiResponse<void>>("/api/auth/logout");
    if (!data.ok) throw new Error(data.message || "Logout failed");
}

// 获取当前用户
export async function getMe() {
    const { data } = await userApi.get<ApiResponse<MyProfileRes>>("/api/users/me");
    if (!data.ok || !data.data) throw new Error(data.message || "Fetch me failed");
    return data.data;
}

// 重发邮箱验证链接（如你的后端支持）
export async function resendVerify(email: string) {
    const { data } = await userApi.post<ApiResponse<void>>(
        "/api/auth/resend",
        null,
        { params: { email } }
    );
    if (!data.ok) throw new Error(data.message || "Resend failed");
}

// 验证链接：/api/auth/verify?token=xxx
export async function verifyEmail(token: string) {
    const { data } = await userApi.get<ApiResponse<boolean>>(
        "/api/auth/verify",
        { params: { token } }
    );
    if (!data.ok) throw new Error(data.message || "Verify failed");
    return data.data === true;
}
