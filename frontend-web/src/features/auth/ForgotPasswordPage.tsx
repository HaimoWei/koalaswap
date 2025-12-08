import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { requestPasswordReset } from "../../api/auth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUiStore } from "../../store/ui";

const schema = z.object({
    email: z.string().email("Please enter a valid email address"),
});

export function ForgotPasswordPage() {
    const nav = useNavigate();
    const closeAuth = useUiStore((s) => s.closeAuth);
    useEffect(() => { closeAuth(); }, [closeAuth]); // 进入页面自动关闭登录弹窗

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

    const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
    });
    const [msg, setMsg] = useState<string>("");

    const onSubmit = handleSubmit(async ({ email }) => {
        setMsg("");
        try {
            await requestPasswordReset(email);
            // 后端无论邮箱是否存在都返回 200：统一提示
            setMsg("If this email exists, we have sent a password reset email. Please check your inbox.");
        } catch (e: any) {
            setMsg(e?.message || "Failed to send email. Please try again later.");
        }
    });

    const isSuccess = msg && !msg.toLowerCase().includes("fail");

    return (
        <main className="flex min-h-[calc(100vh-120px)] items-center justify-center bg-gray-50 px-4 py-12">
            <div className="card w-full max-w-md p-6">
                <header className="mb-6 space-y-1">
                    <p className="text-xs tracking-wide text-[var(--color-secondary-700)]">Forgot password</p>
                    <h1 className="text-2xl font-semibold text-[var(--color-text-strong)]">Send password reset email</h1>
                    <p className="text-sm text-gray-600">Enter your registered email and we will send you an email with steps to reset your password.</p>
                </header>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm text-[var(--color-text-strong)]">Registered email</label>
                        <input
                            className="input text-sm"
                            placeholder="you@example.com"
                            {...register("email")}
                        />
                        {formState.errors.email && (
                            <p className="mt-1 text-xs text-red-600">
                                {formState.errors.email.message}
                            </p>
                        )}
                    </div>

                    {msg && (
                        <div
                            className={`rounded-lg border px-3 py-2 text-sm ${
                                isSuccess
                                    ? "border-[var(--success)] bg-[var(--success-bg)] text-[var(--success)]"
                                    : "border-[var(--error)] bg-[var(--error-bg)] text-[var(--error)]"
                            }`}
                        >
                            {msg}
                        </div>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                            className="btn w-full bg-[var(--color-primary)] text-[var(--color-text-strong)] hover:bg-[var(--color-primary-600)]"
                            disabled={formState.isSubmitting}
                        >
                            {formState.isSubmitting ? "Sending..." : "Send reset email"}
                        </button>
                        <button
                            type="button"
                            onClick={() => nav(`/login?next=${encodeURIComponent(next)}`)}
                            className="btn w-full border border-[var(--color-border)] bg-white text-[var(--color-text)] hover:bg-[var(--color-muted)]"
                        >
                            Back to sign in
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
