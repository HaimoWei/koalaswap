import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { register as apiRegister } from "../api/auth";
import { useAuthStore } from "../store/auth";

const registerSchema = z.object({
    displayName: z.string().min(1, "请输入昵称"),
    email: z.string().email("请输入有效邮箱"),
    password: z.string().min(6, "至少 6 位密码"),
});

export default function RegisterPage() {
    const nav = useNavigate();
    const [sp] = useSearchParams();
    const next = useMemo(() => {
        const raw = sp.get("next");
        if (!raw) return "/";
        try {
            const url = new URL(raw, window.location.origin);
            if (url.origin !== window.location.origin) return "/";
            return url.pathname + url.search + url.hash;
        } catch {
            return raw.startsWith("/") ? raw : "/";
        }
    }, [sp]);
    const token = useAuthStore((s) => s.token);

    useEffect(() => {
        if (token) nav(next, { replace: true });
    }, [token, next, nav]);
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                    <div className="cursor-pointer text-xl font-bold" onClick={() => nav("/")}>KoalaSwap</div>
                    <button
                        onClick={() => nav(next)}
                        className="text-sm text-gray-600 transition hover:text-[var(--color-text-strong)]"
                    >
                        继续浏览
                    </button>
                </div>
            </header>

            <main className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 md:grid-cols-2">
                <section className="hidden md:block">
                    <p className="text-xs tracking-wide text-[var(--color-secondary-700)]">WELCOME TO KOALASWAP</p>
                    <h1 className="mt-2 text-3xl font-extrabold text-[var(--color-text-strong)]">创建你的账户</h1>
                    <p className="mt-3 text-sm text-gray-600">注册后可发布闲置、与卖家聊天、管理订单与收藏。</p>
                    <ul className="mt-6 space-y-3 text-sm text-gray-700">
                        <li>• 邮箱验证保障账户安全</li>
                        <li>• 随时管理你的发布与收藏</li>
                        <li>• 即时消息与订单提醒</li>
                    </ul>
                </section>

                <section>
                    <div className="card p-6">
                        <header className="mb-5 space-y-1">
                            <div className="text-xs tracking-wide text-[var(--color-secondary-700)]">REGISTER</div>
                            <div className="text-2xl font-semibold text-[var(--color-text-strong)]">注册新账户</div>
                            <div className="text-xs text-gray-500">完成注册后请前往邮箱完成验证</div>
                        </header>
                        <RegisterForm />
                        <div className="mt-4 text-sm text-gray-600">
                            已有账号？
                            <Link className="ml-1 font-medium text-[var(--color-secondary)] underline" to={`/login?next=${encodeURIComponent(next)}`}>
                                直接登录
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

function RegisterForm() {
    const { register, handleSubmit, formState } = useForm<z.infer<typeof registerSchema>>({ resolver: zodResolver(registerSchema) });
    const [serverMsg, setServerMsg] = useState<string>("");

    const onSubmit = handleSubmit(async (values) => {
        setServerMsg("");
        try {
            await apiRegister(values);
            setServerMsg("注册成功，请前往邮箱点击验证链接。验证后再登录。");
        } catch (e: any) {
            setServerMsg(e?.message || "注册失败，请重试");
        }
    });

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div>
                <label className="mb-1 block text-sm text-[var(--color-text-strong)]">昵称</label>
                <input className="input text-sm" placeholder="你的昵称" {...register("displayName")} />
                {formState.errors.displayName && <p className="mt-1 text-xs text-red-600">{formState.errors.displayName.message}</p>}
            </div>
            <div>
                <label className="mb-1 block text-sm text-[var(--color-text-strong)]">邮箱</label>
                <input className="input text-sm" placeholder="you@example.com" {...register("email")} />
                {formState.errors.email && <p className="mt-1 text-xs text-red-600">{formState.errors.email.message}</p>}
            </div>
            <div>
                <label className="mb-1 block text-sm text-[var(--color-text-strong)]">密码</label>
                <input type="password" className="input text-sm" placeholder="至少 6 位" {...register("password")} />
                {formState.errors.password && <p className="mt-1 text-xs text-red-600">{formState.errors.password.message}</p>}
            </div>
            {serverMsg && (
                <div className="rounded-lg border border-[var(--info)] bg-[var(--info-bg)] px-3 py-2 text-xs text-[var(--info)]">
                    {serverMsg}
                </div>
            )}
            <button className="btn w-full bg-[var(--color-primary)] text-[var(--color-text-strong)] hover:bg-[var(--color-primary-600)] disabled:opacity-60" disabled={formState.isSubmitting}>
                {formState.isSubmitting ? "提交中..." : "注册"}
            </button>
        </form>
    );
}
