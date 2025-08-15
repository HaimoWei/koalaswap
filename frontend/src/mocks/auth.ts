import { delay, genId, mem, nowISO } from "./db";

export type MockLoginResult = { token: string; user: { id: string; email: string; displayName: string } };
const makeToken = (uid: string, pv: number) => `mock.${uid}.${pv}`;
export function parseMockToken(token: string) {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    if (parts[0] !== "mock") return null;
    return { uid: parts[1], pv: Number(parts[2]) };
}

export async function mockRegister(email: string, password: string, displayName: string) {
    await delay();
    const exists = mem.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) throw { message: "邮箱已被注册", code: "EMAIL_TAKEN" };
    const u = {
        id: genId("u_"),
        email,
        password,
        displayName,
        avatarUrl: null,
        emailVerified: false,
        tokenVersion: 1,
        createdAt: nowISO(),
    };
    mem.users.push(u);
    const token = genId("verify_");
    mem.verifyTokens.push({ token, userId: u.id, expiresAt: Date.now() + 24 * 3600 * 1000, used: false });
    return { userId: u.id, verifyToken: token };
}

export async function mockVerifyEmail(token: string) {
    await delay();
    const rec = mem.verifyTokens.find((v) => v.token === token);
    if (!rec) throw { message: "验证令牌无效", code: "VERIFY_INVALID" };
    if (rec.used) throw { message: "验证令牌已使用", code: "VERIFY_USED" };
    if (Date.now() > rec.expiresAt) throw { message: "验证令牌已过期", code: "VERIFY_EXPIRED" };
    const u = mem.users.find((x) => x.id === rec.userId);
    if (!u) throw { message: "用户不存在" };
    u.emailVerified = true;
    rec.used = true;
    return { ok: true };
}

export async function mockLogin(email: string, password: string): Promise<MockLoginResult> {
    await delay();
    const u = mem.users.find((x) => x.email.toLowerCase() === email.toLowerCase());
    if (!u || u.password !== password) throw { message: "邮箱或密码错误", code: "BAD_CREDENTIALS" };
    if (!u.emailVerified) throw { message: "邮箱未验证，请先验证", code: "EMAIL_NOT_VERIFIED" };
    const token = makeToken(u.id, u.tokenVersion);
    return { token, user: { id: u.id, email: u.email, displayName: u.displayName } };
}

export async function mockLogoutAll(uid: string) {
    await delay();
    const u = mem.users.find((x) => x.id === uid);
    if (u) u.tokenVersion += 1;
}

export async function mockForgotPassword(email: string) {
    await delay();
    const u = mem.users.find((x) => x.email.toLowerCase() === email.toLowerCase());
    if (!u) return { sent: true, note: "如果邮箱存在，系统会发送重置邮件" };
    const token = genId("reset_");
    mem.resetTokens.push({ token, userId: u.id, expiresAt: Date.now() + 30 * 60 * 1000, used: false });
    return { sent: true, token };
}

export async function mockResetPassword(token: string, newPassword: string) {
    await delay();
    const rec = mem.resetTokens.find((x) => x.token === token);
    if (!rec) throw { message: "重置令牌无效", code: "RESET_INVALID" };
    if (rec.used) throw { message: "重置令牌已使用", code: "RESET_USED" };
    if (Date.now() > rec.expiresAt) throw { message: "重置令牌已过期", code: "RESET_EXPIRED" };
    const u = mem.users.find((x) => x.id === rec.userId);
    if (!u) throw { message: "用户不存在" };
    u.password = newPassword;
    u.tokenVersion += 1;
    rec.used = true;
    return { ok: true };
}
