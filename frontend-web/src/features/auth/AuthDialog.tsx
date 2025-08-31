import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { login, register } from "../../api/auth";
import { useAuthStore } from "../../store/auth";

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
    const setAuth = useAuthStore((s) => s.setAuth);

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
                        className={`px-3 py-1 rounded ${
                            tab === "login" ? "bg-black text-white" : "bg-gray-100"
                        }`}
                    >
                        登录
                    </button>
                    <button
                        onClick={() => setTab("register")}
                        className={`px-3 py-1 rounded ${
                            tab === "register" ? "bg-black text-white" : "bg-gray-100"
                        }`}
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
    const { register: f, handleSubmit, formState } = useForm<
        z.infer<typeof loginSchema>
    >({ resolver: zodResolver(loginSchema) });

    const onSubmit = handleSubmit(async (values) => {
        const res = await login(values.email, values.password);
        setAuth(res.accessToken, res.profile);
        // 关闭弹窗：这里简单粗暴地刷新触发 App 状态变更
        window.location.reload();
    });

    return (
        <form onSubmit={onSubmit} className="space-y-3">
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
                {formState.isSubmitting ? "登录中..." : "登录"}
            </button>
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
