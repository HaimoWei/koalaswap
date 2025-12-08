import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { register as apiRegister } from "../api/auth";
import { useAuthStore } from "../store/auth";

const registerSchema = z.object({
    displayName: z.string().min(1, "Please enter a display name"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
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
                        Continue browsing
                    </button>
                </div>
            </header>

            <main className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 md:grid-cols-2">
                <section className="hidden md:block">
                    <p className="text-xs tracking-wide text-[var(--color-secondary-700)]">WELCOME TO KOALASWAP</p>
                    <h1 className="mt-2 text-3xl font-extrabold text-[var(--color-text-strong)]">Create your account</h1>
                    <p className="mt-3 text-sm text-gray-600">
                        Sign up to list items, chat with sellers, and manage your orders and favorites.
                    </p>
                    <ul className="mt-6 space-y-3 text-sm text-gray-700">
                        <li>• Email verification keeps your account secure</li>
                        <li>• Manage your listings and favorites anytime</li>
                        <li>• Instant messages and order notifications</li>
                    </ul>
                </section>

                <section>
                    <div className="card p-6">
                        <header className="mb-5 space-y-1">
                            <div className="text-xs tracking-wide text-[var(--color-secondary-700)]">REGISTER</div>
                            <div className="text-2xl font-semibold text-[var(--color-text-strong)]">Register a new account</div>
                            <div className="text-xs text-gray-500">
                                After signing up, please check your email to complete verification.
                            </div>
                        </header>
                        <RegisterForm />
                        <div className="mt-4 text-sm text-gray-600">
                            Already have an account?
                            <Link
                                className="ml-1 font-medium text-[var(--color-secondary)] underline"
                                to={`/login?next=${encodeURIComponent(next)}`}
                            >
                                Sign in instead
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
            setServerMsg(
                "Signed up successfully. Please click the verification link sent to your email before signing in."
            );
        } catch (e: any) {
            setServerMsg(e?.message || "Sign-up failed, please try again");
        }
    });

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div>
                <label className="mb-1 block text-sm text-[var(--color-text-strong)]">Display name</label>
                <input className="input text-sm" placeholder="Your display name" {...register("displayName")} />
                {formState.errors.displayName && <p className="mt-1 text-xs text-red-600">{formState.errors.displayName.message}</p>}
            </div>
            <div>
                <label className="mb-1 block text-sm text-[var(--color-text-strong)]">Email</label>
                <input className="input text-sm" placeholder="you@example.com" {...register("email")} />
                {formState.errors.email && <p className="mt-1 text-xs text-red-600">{formState.errors.email.message}</p>}
            </div>
            <div>
                <label className="mb-1 block text-sm text-[var(--color-text-strong)]">Password</label>
                <input
                    type="password"
                    className="input text-sm"
                    placeholder="At least 6 characters"
                    {...register("password")}
                />
                {formState.errors.password && <p className="mt-1 text-xs text-red-600">{formState.errors.password.message}</p>}
            </div>
            {serverMsg && (
                <div className="rounded-lg border border-[var(--info)] bg-[var(--info-bg)] px-3 py-2 text-xs text-[var(--info)]">
                    {serverMsg}
                </div>
            )}
            <button
                className="btn w-full bg-[var(--color-primary)] text-[var(--color-text-strong)] hover:bg-[var(--color-primary-600)] disabled:opacity-60"
                disabled={formState.isSubmitting}
            >
                {formState.isSubmitting ? "Submitting..." : "Sign up"}
            </button>
        </form>
    );
}
