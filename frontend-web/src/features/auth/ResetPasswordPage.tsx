import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPassword, validateResetToken } from "../../api/auth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUiStore } from "../../store/ui";

const schema = z
    .object({
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirm: z.string().min(6, "Password must be at least 6 characters"),
    })
    .refine((d) => d.password === d.confirm, {
        path: ["confirm"],
        message: "Passwords do not match",
    });

export function ResetPasswordPage() {
    const nav = useNavigate();
    const closeAuth = useUiStore((s) => s.closeAuth);
    useEffect(() => { closeAuth(); }, [closeAuth]); // 进入页面自动关闭登录弹窗

    const [params] = useSearchParams();
    const token = params.get("token") || "";
    const next = useMemo(() => {
        const raw = params.get("next");
        if (!raw) return "/";
        try {
            const url = new URL(raw, window.location.origin);
            if (url.origin !== window.location.origin) return "/";
            return url.pathname + url.search + url.hash;
        } catch {
            return raw.startsWith("/") ? raw : "/";
        }
    }, [params]);

    const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
    });

    const [msg, setMsg] = useState<string>("");
    const [valid, setValid] = useState<null | boolean>(null); // null = validating

    // Pre-validate token
    useEffect(() => {
        let mounted = true;
        (async () => {
            if (!token) { setValid(false); return; }
            try {
                const ok = await validateResetToken(token);
                if (mounted) setValid(ok);
            } catch {
                if (mounted) setValid(false);
            }
        })();
        return () => { mounted = false; };
    }, [token]);

    const onSubmit = handleSubmit(async ({ password }) => {
        setMsg("");
        try {
            if (!token) throw new Error("Reset link is missing token.");
            await resetPassword(token, password);
            setMsg("Your password has been reset. Please sign in with your new password.");
        } catch (e: any) {
            setMsg(e?.message || "Reset failed. Please try again later.");
        }
    });

    if (valid === null) {
        return (
            <main className="flex min-h-[60vh] items-center justify-center bg-[var(--color-primary-50)] px-4">
                <div className="card w-full max-w-md space-y-3 p-6 text-center">
                    <p className="text-sm text-gray-600">Validating reset link, please wait...</p>
                </div>
            </main>
        );
    }

    if (valid === false) {
        return (
            <main className="flex min-h-[calc(100vh-120px)] items-center justify-center bg-[var(--color-primary-50)] px-4 py-12">
                <div className="card w-full max-w-md space-y-4 p-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-warning-bg)] text-[var(--warning)]">
                        !
                    </div>
                    <h1 className="text-2xl font-semibold text-[var(--color-text-strong)]">Link not available</h1>
                    <p className="text-sm text-gray-600">
                        The reset link is invalid or has expired. Please start password recovery again.
                    </p>
                    <button
                        onClick={() => nav(`/auth/forgot?next=${encodeURIComponent(next)}`)}
                        className="btn w-full bg-[var(--color-primary)] text-[var(--color-text-strong)] hover:bg-[var(--color-primary-600)]"
                    >
                        Go to password recovery
                    </button>
                </div>
            </main>
        );
    }

    const isSuccess = msg && !msg.toLowerCase().includes("fail");

    return (
        <main className="flex min-h-[calc(100vh-120px)] items-center justify-center bg-[var(--color-primary-50)] px-4 py-12">
            <div className="card w-full max-w-md p-6">
                <header className="mb-6 space-y-1">
                    <p className="text-xs tracking-wide text-[var(--color-secondary-700)]">Reset password</p>
                    <h1 className="text-2xl font-semibold text-[var(--color-text-strong)]">Set a new password</h1>
                    <p className="text-sm text-gray-600">For security, please use a unique password with at least 6 characters.</p>
                </header>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm text-[var(--color-text-strong)]">New password</label>
                        <input
                            type="password"
                            className="input text-sm"
                            placeholder="At least 6 characters"
                            {...register("password")}
                        />
                        {formState.errors.password && (
                            <p className="mt-1 text-xs text-red-600">
                                {formState.errors.password.message}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="mb-1 block text-sm text-[var(--color-text-strong)]">Confirm new password</label>
                        <input
                            type="password"
                            className="input text-sm"
                            placeholder="Enter again"
                            {...register("confirm")}
                        />
                        {formState.errors.confirm && (
                            <p className="mt-1 text-xs text-red-600">
                                {formState.errors.confirm.message}
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
                            {formState.isSubmitting ? "Submitting..." : "Confirm reset"}
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
