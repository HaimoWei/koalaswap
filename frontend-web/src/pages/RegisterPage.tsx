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
    const next = useMemo(() => sp.get("next") || "/", [sp]);
    const token = useAuthStore((s) => s.token);
    const [canGoBack, setCanGoBack] = useState(false);

    useEffect(() => {
        if (token) nav(next, { replace: true });
    }, [token, next, nav]);
    useEffect(() => { setCanGoBack(window.history.length > 1); }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 页头 */}
            <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="font-bold text-xl cursor-pointer" onClick={() => nav("/")}>KoalaSwap</div>
                    <button onClick={() => (canGoBack ? nav(-1) : nav("/"))} className="text-sm text-gray-600 hover:text-[var(--color-text-strong)]">继续浏览</button>
                </div>
            </header>

            {/* 主体：两栏布局 */}
            <main className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* 左侧品牌区 */}
                <section className="hidden md:block">
                    <h1 className="text-3xl font-extrabold">创建你的账户</h1>
                    <p className="mt-3 text-gray-600">注册后可发布闲置、与卖家聊天、管理订单与收藏。</p>
                    <ul className="mt-6 space-y-2 text-gray-700">
                        <li>• 邮箱验证保障账户安全</li>
                        <li>• 随时管理你的发布与收藏</li>
                        <li>• 即时消息与订单提醒</li>
                    </ul>
                </section>

                {/* 右侧注册卡片 */}
                <section>
                    <div className="card p-6">
                        <div className="mb-1 text-2xl font-semibold">注册新账户</div>
                        <div className="text-xs text-gray-500 mb-4">完成注册后请前往邮箱完成验证</div>
                        <RegisterForm />
                        <div className="mt-4 text-sm text-gray-600">
                            已有账号？
                            <Link className="ml-1 underline" to={`/login?next=${encodeURIComponent(next)}`}>直接登录</Link>
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
        <form onSubmit={onSubmit} className="space-y-3">
            <div>
                <label className="block text-sm mb-1">昵称</label>
                <input className="w-full border rounded px-3 py-2 text-sm" placeholder="你的昵称" {...register("displayName")} />
                {formState.errors.displayName && <p className="text-xs text-red-600 mt-1">{formState.errors.displayName.message}</p>}
            </div>
            <div>
                <label className="block text-sm mb-1">邮箱</label>
                <input className="w-full border rounded px-3 py-2 text-sm" placeholder="you@example.com" {...register("email")} />
                {formState.errors.email && <p className="text-xs text-red-600 mt-1">{formState.errors.email.message}</p>}
            </div>
            <div>
                <label className="block text-sm mb-1">密码</label>
                <input type="password" className="w-full border rounded px-3 py-2 text-sm" placeholder="至少 6 位" {...register("password")} />
                {formState.errors.password && <p className="text-xs text-red-600 mt-1">{formState.errors.password.message}</p>}
            </div>
            {serverMsg && <div className="text-xs text-gray-600 bg-gray-50 border rounded p-2">{serverMsg}</div>}
            <button className="w-full bg-black text-white rounded py-2 text-sm disabled:opacity-60" disabled={formState.isSubmitting}>
                {formState.isSubmitting ? "提交中..." : "注册"}
            </button>
        </form>
    );
}
