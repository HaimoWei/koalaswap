import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { login } from "../api/auth";
import { getProduct } from "../api/products";
import { useAuthStore } from "../store/auth";

const loginSchema = z.object({
    email: z.string().email("请输入有效邮箱"),
    password: z.string().min(6, "至少 6 位密码"),
});

const registerSchema = z.object({
    displayName: z.string().min(1, "请输入昵称"),
    email: z.string().email("请输入有效邮箱"),
    password: z.string().min(6, "至少 6 位密码"),
});

export default function LoginPage() {
    const nav = useNavigate();
    const [sp] = useSearchParams();
    const next = useMemo(() => sp.get("next") || "/", [sp]);
    const token = useAuthStore((s) => s.token);
    const setAuth = useAuthStore((s) => s.setAuth);
    const [tab, setTab] = useState<"login" | "register">("login");
    const [canGoBack, setCanGoBack] = useState(false);
    const [nextHint, setNextHint] = useState<string | null>(null);

    useEffect(() => {
        if (token) nav(next, { replace: true });
    }, [token, next, nav]);

    useEffect(() => {
        setCanGoBack(window.history.length > 1);
    }, []);

    useEffect(() => {
        // 友好提示：登录后将跳转到哪里
        if (!next) { setNextHint(null); return; }
        try {
            const url = new URL(next, window.location.origin);
            const path = url.pathname;
            if (/^\/chat/.test(path)) {
                setNextHint("登录后将前往：聊天");
                return;
            }
            const m = path.match(/^\/products?\/(.+)$/);
            if (m && m[1]) {
                const id = m[1];
                getProduct(id).then(p => setNextHint(`登录后将前往：商品 “${p.title}”`)).catch(() => setNextHint("登录后将前往：商品详情"));
                return;
            }
            setNextHint(`登录后将前往：${path}`);
        } catch {
            setNextHint(null);
        }
    }, [next]);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 页头 */}
            <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="font-bold text-xl cursor-pointer" onClick={() => nav("/")}>KoalaSwap</div>
                    <button
                        onClick={() => (canGoBack ? nav(-1) : nav("/"))}
                        className="text-sm text-gray-600 hover:text-[var(--color-text-strong)]"
                    >
                        继续浏览
                    </button>
                </div>
            </header>

            {/* 主体：两栏布局 */}
            <main className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* 左侧品牌区 */}
                <section className="hidden md:block">
                    <h1 className="text-3xl font-extrabold">欢迎回来</h1>
                    <p className="mt-3 text-gray-600">登录以发布闲置、与卖家聊天、管理订单与收藏。</p>
                    <ul className="mt-6 space-y-2 text-gray-700">
                        <li>• 安全可靠的交易保障</li>
                        <li>• 一键收藏与消息提醒</li>
                        <li>• 智能搜索与个性推荐</li>
                    </ul>
                </section>

                {/* 右侧登录卡片 */}
                <section>
                    <div className="card p-6">
                        <div className="mb-1 text-2xl font-semibold">登录你的账户</div>
                        <div className="text-xs text-gray-500 mb-4">使用邮箱与密码登录</div>

                        {nextHint && (
                            <div className="mb-4 text-xs text-gray-700 bg-gray-50 border rounded p-2">{nextHint}</div>
                        )}

                        <LoginForm
                            onSuccess={(auth) => {
                                setAuth(auth.accessToken, auth.profile);
                                nav(next, { replace: true });
                            }}
                        />

                        <div className="mt-4 text-sm text-gray-600">
                            还没有账号？
                            <Link className="ml-1 underline" to={`/register?next=${encodeURIComponent(next)}`}>创建一个</Link>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

function LoginForm({ onSuccess }: { onSuccess: (auth: { accessToken: string; profile: any }) => void }) {
    const { register, handleSubmit, formState } = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) });
    const [serverMsg, setServerMsg] = useState<string>("");
    const [showPwd, setShowPwd] = useState(false);
    const [remember, setRemember] = useState(true);

    const onSubmit = handleSubmit(async (values) => {
        setServerMsg("");
        try {
            const res = await login(values.email, values.password);
            // 记住我：当前 token 已持久化，额外逻辑可在此扩展
            onSuccess(res);
        } catch (e: any) {
            setServerMsg(e?.message || "登录失败，请重试");
        }
    });

    return (
        <form onSubmit={onSubmit} className="space-y-3">
            <div>
                <label className="block text-sm mb-1">邮箱</label>
                <input className="input text-sm" placeholder="you@example.com" {...register("email")} />
                {formState.errors.email && <p className="text-xs text-red-600 mt-1">{formState.errors.email.message}</p>}
            </div>
            <div>
                <label className="block text-sm mb-1">密码</label>
                <div className="relative">
                    <input type={showPwd ? "text" : "password"} className="input text-sm pr-10" placeholder="至少 6 位" {...register("password")} />
                    <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                        {showPwd ? "隐藏" : "显示"}
                    </button>
                </div>
                {formState.errors.password && <p className="text-xs text-red-600 mt-1">{formState.errors.password.message}</p>}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600">
                <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                    记住我
                </label>
                <div>
                    <Link to="/auth/forgot" className="underline">忘记密码？</Link>
                </div>
            </div>
            {serverMsg && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{serverMsg}</div>}
            <button className="w-full btn btn-primary disabled:opacity-60" disabled={formState.isSubmitting}>
                {formState.isSubmitting ? "登录中..." : "登录"}
            </button>
            <div className="text-xs text-gray-600 text-center">
                没收到验证邮件？ <Link to="/auth/resend" className="underline">重新发送</Link>
            </div>
        </form>
    );
}

// 注册页面单独实现，登录页提供跳转入口
