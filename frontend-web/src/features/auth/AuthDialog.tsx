import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { login, register } from "../../api/auth";
import { useAuthStore } from "../../store/auth";
import { useUiStore } from "../../store/ui";
import { useNavigate } from "react-router-dom";

const loginSchema = z.object({
    email: z.string().email("请输入有效邮箱"),
    password: z.string().min(6, "至少 6 位密码"),
});

const registerSchema = z.object({
    email: z.string().email("请输入有效邮箱"),
    password: z.string().min(6, "至少 6 位密码"),
    displayName: z.string().min(1, "请输入昵称"),
});

export function AuthDialog({
                               open,
                               onClose,
                           }: {
    open: boolean;
    onClose: () => void;
}) {
    const [tab, setTab] = useState<"login" | "register">("login");

    useEffect(() => {
        if (!open) setTab("login");
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="w-[92%] max-w-md rounded-xl bg-white p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">
                        {tab === "login" ? "登录" : "注册"}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-black">
                        ✕
                    </button>
                </div>

                <div className="mb-4 flex gap-3 text-sm">
                    <button
                        onClick={() => setTab("login")}
                        className={`px-3 py-1 rounded ${tab === "login" ? "bg-black text-white" : "bg-gray-100"}`}
                    >
                        登录
                    </button>
                    <button
                        onClick={() => setTab("register")}
                        className={`px-3 py-1 rounded ${tab === "register" ? "bg-black text-white" : "bg-gray-100"}`}
                    >
                        注册
                    </button>
                </div>

                {tab === "login" ? <LoginForm /> : <RegisterForm />}

                <p className="text-xs text-gray-500 mt-4">
                    登录/注册即表示你同意平台的用户协议与隐私政策。
                </p>
            </div>
        </div>
    );
}

function LoginForm() {
    const setAuth = useAuthStore((s) => s.setAuth);
    const closeAuth = useUiStore((s) => s.closeAuth);
    const nav = useNavigate();

    const { register: f, handleSubmit, formState } = useForm<
        z.infer<typeof loginSchema>
    >({ resolver: zodResolver(loginSchema) });

    const [serverMsg, setServerMsg] = useState<string>("");

    const onSubmit = handleSubmit(async (values) => {
        setServerMsg("");
        try {
            const res = await login(values.email, values.password);
            setAuth(res.accessToken, res.profile);
            window.location.reload(); // 保持你的现有行为
        } catch (e: any) {
            setServerMsg(e?.message || "登录失败，请重试");
        }
    });

    // ★ 导航到“重发验证邮件”页：先关弹窗，再跳转
    function goResend() {
        closeAuth();
        nav("/auth/resend");
    }

    // ★ 导航到“忘记密码”页：先关弹窗，再跳转
    function goForgot() {
        closeAuth();
        nav("/auth/forgot");
    }

    return (
        <form onSubmit={onSubmit} className="space-y-3">
            <div>
                <label className="block text-sm mb-1">邮箱</label>
                <input
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="you@example.com"
                    autoFocus
                    {...f("email")}
                />
                {formState.errors.email && (
                    <p className="text-xs text-red-600 mt-1">
                        {formState.errors.email.message}
                    </p>
                )}
            </div>
            <div>
                <label className="block text-sm mb-1">密码</label>
                <input
                    type="password"
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="至少 6 位"
                    {...f("password")}
                />
                {formState.errors.password && (
                    <p className="text-xs text-red-600 mt-1">
                        {formState.errors.password.message}
                    </p>
                )}
            </div>

            {serverMsg && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">
                    {serverMsg}
                </div>
            )}

            <button
                className="w-full bg-black text-white rounded py-2 text-sm disabled:opacity-60"
                disabled={formState.isSubmitting}
            >
                {formState.isSubmitting ? "登录中..." : "登录"}
            </button>

            {/* ★ 按规范：跳到专注页处理，不在弹窗里直接发请求 */}
            <div className="text-xs text-gray-600 text-center">
                没收到验证邮件？{" "}
                <button type="button" onClick={goResend} className="underline">
                    重新发送
                </button>
                <span className="mx-2">|</span>
                忘记密码？{" "}
                <button type="button" onClick={goForgot} className="underline">
                    重置密码
                </button>
            </div>
        </form>
    );
}

function RegisterForm() {
    const { register: f, handleSubmit, formState } = useForm<
        z.infer<typeof registerSchema>
    >({ resolver: zodResolver(registerSchema) });

    const onSubmit = handleSubmit(async (values) => {
        await register(values);
        alert("注册成功，请前往邮箱点击验证链接。验证后再登录。");
    });

    return (
        <form onSubmit={onSubmit} className="space-y-3">
            <div>
                <label className="block text-sm mb-1">昵称</label>
                <input
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="你的昵称"
                    {...f("displayName")}
                />
                {formState.errors.displayName && (
                    <p className="text-xs text-red-600 mt-1">
                        {formState.errors.displayName.message}
                    </p>
                )}
            </div>
            <div>
                <label className="block text-sm mb-1">邮箱</label>
                <input
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="you@example.com"
                    {...f("email")}
                />
                {formState.errors.email && (
                    <p className="text-xs text-red-600 mt-1">
                        {formState.errors.email.message}
                    </p>
                )}
            </div>
            <div>
                <label className="block text-sm mb-1">密码</label>
                <input
                    type="password"
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="至少 6 位"
                    {...f("password")}
                />
                {formState.errors.password && (
                    <p className="text-xs text-red-600 mt-1">
                        {formState.errors.password.message}
                    </p>
                )}
            </div>
            <button
                className="w-full bg-black text-white rounded py-2 text-sm disabled:opacity-60"
                disabled={formState.isSubmitting}
            >
                {formState.isSubmitting ? "提交中..." : "注册"}
            </button>
        </form>
    );
}
