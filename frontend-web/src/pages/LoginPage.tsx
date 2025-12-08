import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { login } from "../api/auth";
import { getProduct } from "../api/products";
import { useAuthStore } from "../store/auth";

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function LoginPage() {
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
    const setAuth = useAuthStore((s) => s.setAuth);
    const [nextHint, setNextHint] = useState<string | null>(null);

    useEffect(() => {
        if (token) nav(next, { replace: true });
    }, [token, next, nav]);

    useEffect(() => {
        // Friendly hint: where you will be redirected after login
        if (!next) { setNextHint(null); return; }
        try {
            const url = new URL(next, window.location.origin);
            const path = url.pathname;
            if (/^\/chat/.test(path)) {
                setNextHint("You will be redirected to: Chat");
                return;
            }
            const m = path.match(/^\/products?\/(.+)$/);
            if (m && m[1]) {
                const id = m[1];
                getProduct(id)
                    .then(p => setNextHint(`You will be redirected to: Item “${p.title}”`))
                    .catch(() => setNextHint("You will be redirected to: Item details"));
                return;
            }
            setNextHint(`You will be redirected to: ${path}`);
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
                        onClick={() => nav(next)}
                        className="text-sm text-gray-600 hover:text-[var(--color-text-strong)]"
                    >
                        Continue browsing
                    </button>
                </div>
            </header>

            {/* 主体：两栏布局 */}
            <main className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Left side branding section */}
                <section className="hidden md:block">
                    <h1 className="text-3xl font-extrabold">Welcome back</h1>
                    <p className="mt-3 text-gray-600">
                        Sign in to list items, chat with sellers, and manage your orders and favorites.
                    </p>
                    <ul className="mt-6 space-y-2 text-gray-700">
                        <li>• Secure and reliable buyer protection</li>
                        <li>• One-tap favorites and notifications</li>
                        <li>• Smart search and personalized recommendations</li>
                    </ul>
                </section>

                {/* Right side sign-in card */}
                <section>
                    <div className="card p-6">
                        <div className="mb-1 text-2xl font-semibold">Sign in to your account</div>
                        <div className="text-xs text-gray-500 mb-4">Sign in with your email and password</div>


                        <LoginForm
                            returnPath={next}
                            onSuccess={(auth) => {
                                setAuth(auth.accessToken, auth.profile);
                                nav(next, { replace: true });
                            }}
                        />

                        <div className="mt-4 text-sm text-gray-600">
                            Don't have an account?
                            <Link className="ml-1 underline" to={`/register?next=${encodeURIComponent(next)}`}>Create one</Link>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

function LoginForm({
    onSuccess,
    returnPath,
}: {
    onSuccess: (auth: { accessToken: string; profile: any }) => void;
    returnPath: string;
}) {
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
            setServerMsg(e?.message || "Sign-in failed, please try again");
        }
    });

    return (
        <form onSubmit={onSubmit} className="space-y-3">
            <div>
                <label className="block text-sm mb-1">Email</label>
                <input className="input text-sm" placeholder="you@example.com" {...register("email")} />
                {formState.errors.email && <p className="text-xs text-red-600 mt-1">{formState.errors.email.message}</p>}
            </div>
            <div>
                <label className="block text-sm mb-1">Password</label>
                <div className="relative">
                    <input
                        type={showPwd ? "text" : "password"}
                        className="input text-sm pr-10"
                        placeholder="At least 6 characters"
                        {...register("password")}
                    />
                    <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                        {showPwd ? "Hide" : "Show"}
                    </button>
                </div>
                {formState.errors.password && <p className="text-xs text-red-600 mt-1">{formState.errors.password.message}</p>}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600">
                <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                    Remember me
                </label>
                <div>
                    <Link to={`/auth/forgot?next=${encodeURIComponent(returnPath)}`} className="underline">Forgot password?</Link>
                </div>
            </div>
            {serverMsg && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">
                    {serverMsg}
                </div>
            )}
            <button className="w-full btn btn-primary disabled:opacity-60" disabled={formState.isSubmitting}>
                {formState.isSubmitting ? "Signing in..." : "Sign in"}
            </button>
            <div className="text-xs text-gray-600 text-center">
                Didn't receive a verification email?{" "}
                <Link to={`/auth/resend?next=${encodeURIComponent(returnPath)}`} className="underline">
                    Resend
                </Link>
            </div>
        </form>
    );
}

// 注册页面单独实现，登录页提供跳转入口
