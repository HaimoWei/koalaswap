import { userApi } from "./http";
import type { ApiResponse, LoginRes, MyProfileRes } from "./types";

// 从 axios 错误中尽量提取后端 message
function pickMsg(e: any, fallback: string) {
    return e?.response?.data?.message || e?.message || fallback;
}

// 登录
export async function login(email: string, password: string) {
    try {
        const { data } = await userApi.post<ApiResponse<LoginRes>>(
            "/api/auth/login",
            { email, password }
        );
        if (!data.ok || !data.data) throw new Error(data.message || "Login failed");
        return data.data;
    } catch (e: any) {
        throw new Error(pickMsg(e, "Login failed"));
    }
}

// 注册
export async function register(payload: {
    email: string;
    password: string;
    displayName: string;
}) {
    try {
        const { data } = await userApi.post<ApiResponse<MyProfileRes>>(
            "/api/auth/register",
            payload
        );
        if (!data.ok || !data.data)
            throw new Error(data.message || "Register failed");
        return data.data;
    } catch (e: any) {
        throw new Error(pickMsg(e, "Register failed"));
    }
}

// 退出
export async function logout() {
    try {
        const { data } = await userApi.post<ApiResponse<void>>("/api/auth/logout");
        if (!data.ok) throw new Error(data.message || "Logout failed");
    } catch (e: any) {
        throw new Error(pickMsg(e, "Logout failed"));
    }
}

// 获取当前用户
export async function getMe() {
    try {
        const { data } = await userApi.get<ApiResponse<MyProfileRes>>(
            "/api/users/me"
        );
        if (!data.ok || !data.data) throw new Error(data.message || "Fetch me failed");
        return data.data;
    } catch (e: any) {
        throw new Error(pickMsg(e, "Fetch me failed"));
    }
}

// 重发邮箱验证链接
export async function resendVerify(email: string) {
    try {
        const { data } = await userApi.post<ApiResponse<void>>(
            "/api/auth/resend",
            null,
            { params: { email } }
        );
        if (!data.ok) throw new Error(data.message || "Resend failed");
    } catch (e: any) {
        throw new Error(pickMsg(e, "Resend failed"));
    }
}

// 验证邮箱：/api/auth/verify?token=xxx
export async function verifyEmail(token: string) {
    try {
        const { data } = await userApi.get<ApiResponse<void>>(
            "/api/auth/verify",
            { params: { token } }
        );
        if (!data.ok) throw new Error(data.message || "Verify failed");
        return true; // 后端 Void，只要 ok 就是成功
    } catch (e: any) {
        throw new Error(pickMsg(e, "Verify failed"));
    }
}

/* =========================
   忘记/重置密码（与后端完全对齐）
   ========================= */

// 1) 发送重置密码邮件（你的后端是 JSON body）
export async function requestPasswordReset(email: string) {
    try {
        const { data } = await userApi.post<ApiResponse<void>>(
            "/api/auth/forgot-password",
            { email }
        );
        if (!data.ok) throw new Error(data.message || "Reset request failed");
    } catch (e: any) {
        throw new Error(pickMsg(e, "Reset request failed"));
    }
}

// 2) 校验重置 token 是否可用
export async function validateResetToken(token: string) {
    try {
        const { data } = await userApi.get<ApiResponse<boolean>>(
            "/api/auth/reset-password/validate",
            { params: { token } }
        );
        if (!data.ok) throw new Error(data.message || "Validate failed");
        return data.data === true;
    } catch (e: any) {
        throw new Error(pickMsg(e, "Validate failed"));
    }
}

// 3) 提交新密码
export async function resetPassword(token: string, newPassword: string) {
    try {
        const { data } = await userApi.post<ApiResponse<void>>(
            "/api/auth/reset-password",
            { token, newPassword }
        );
        if (!data.ok) throw new Error(data.message || "Reset failed");
    } catch (e: any) {
        throw new Error(pickMsg(e, "Reset failed"));
    }
}
