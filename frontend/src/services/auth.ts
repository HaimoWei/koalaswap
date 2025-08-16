import { ENV } from "../lib/env";
import { userApi } from "../lib/api";
import { unwrap } from "../lib/unwrap";
import type { ApiResponse } from "../lib/types";

export type RegisterResult = { sent: true };

export const AuthService = {
    async register(email: string, password: string, displayName: string): Promise<RegisterResult> {
        if (ENV.USE_MOCKS) {
            const { mockRegister } = await import("../mocks/auth");
            await mockRegister(email, password, displayName);
            return { sent: true };
        }
        const res = await userApi.post<ApiResponse<any>>("/api/auth/register", { email, password, displayName });
        unwrap(res.data); // 后端返回 MyProfileRes；前端这里只需要“成功”即可
        return { sent: true };
    },

    async verifyEmail(token: string) {
        if (ENV.USE_MOCKS) {
            const { mockVerifyEmail } = await import("../mocks/auth");
            return mockVerifyEmail(token);
        }
        const res = await userApi.get<ApiResponse<void>>("/api/auth/verify", { params: { token } });
        unwrap(res.data);
        return { ok: true as const };
    },

    async resend(email: string) {
        if (ENV.USE_MOCKS) return { ok: true as const };
        const res = await userApi.post<ApiResponse<void>>("/api/auth/resend", null, { params: { email } });
        unwrap(res.data);
        return { ok: true as const };
    },

    async login(email: string, password: string) {
        if (ENV.USE_MOCKS) {
            const { mockLogin } = await import("../mocks/auth");
            return mockLogin(email, password);
        }
        const res = await userApi.post<ApiResponse<{ accessToken: string; profile: any }>>("/api/auth/login", { email, password });
        const data = unwrap(res.data);
        // 适配到前端当前 AuthContext 期望的形状
        return {
            token: data.accessToken,
            user: { id: data.profile.id, email: data.profile.email, displayName: data.profile.displayName },
        };
    },

    async forgot(email: string) {
        if (ENV.USE_MOCKS) {
            const { mockForgotPassword } = await import("../mocks/auth");
            const r = await mockForgotPassword(email);
            return { sent: true, token: (r as any).token, note: (r as any).note };
        }
        const res = await userApi.post<ApiResponse<void>>("/api/auth/forgot-password", { email });
        unwrap(res.data);
        return { sent: true as const };
    },

    async reset(token: string, newPassword: string) {
        if (ENV.USE_MOCKS) {
            const { mockResetPassword } = await import("../mocks/auth");
            return mockResetPassword(token, newPassword);
        }
        const res = await userApi.post<ApiResponse<void>>("/api/auth/reset-password", { token, newPassword });
        unwrap(res.data);
        return { ok: true as const };
    },
};

export default AuthService;
