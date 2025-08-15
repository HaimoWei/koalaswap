import { ENV } from "../lib/env";
import { mockForgotPassword, mockLogin, mockRegister, mockResetPassword, mockVerifyEmail } from "../mocks/auth";
// 将来联调：import { userApi } from "../lib/api"; import { unwrap } from "../lib/unwrap";

export type RegisterResp = { userId: string; verifyToken: string };
export type ForgotResp = { sent: true; token?: string; note?: string };

export const AuthService = {
    async register(email: string, password: string, displayName: string): Promise<RegisterResp> {
        if (ENV.USE_MOCKS) return mockRegister(email, password, displayName);
        throw new Error("TODO: POST /api/auth/register");
    },
    async verifyEmail(token: string) {
        if (ENV.USE_MOCKS) return mockVerifyEmail(token);
        throw new Error("TODO: GET /api/verify?token=...");
    },
    async login(email: string, password: string) {
        if (ENV.USE_MOCKS) return mockLogin(email, password);
        throw new Error("TODO: POST /api/auth/login");
    },
    async forgot(email: string): Promise<ForgotResp> {
        if (ENV.USE_MOCKS) {
            const r = await mockForgotPassword(email);
            // 无论 mock 返回哪种分支，都转成统一 shape
            return { sent: true, token: (r as any).token, note: (r as any).note };
        }
        // TODO: 联调时同样 return { sent:true, token?:string, note?:string }
        throw new Error("TODO: POST /api/auth/forgot-password");
    },
    async reset(token: string, newPassword: string) {
        if (ENV.USE_MOCKS) return mockResetPassword(token, newPassword);
        throw new Error("TODO: POST /api/auth/reset-password");
    },
};
