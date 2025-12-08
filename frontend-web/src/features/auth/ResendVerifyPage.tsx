import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { resendVerify } from "../../api/auth";
import { useNavigate } from "react-router-dom";
import { useUiStore } from "../../store/ui";

const schema = z.object({
    email: z.string().email("Please enter a valid email address"),
});

export function ResendVerifyPage() {
    const nav = useNavigate();
    const closeAuth = useUiStore((s) => s.closeAuth);
    useEffect(() => { closeAuth(); }, [closeAuth]); // 进入页面自动关闭登录弹窗

    const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
    });
    const [msg, setMsg] = useState<string>("");

    const onSubmit = handleSubmit(async ({ email }) => {
        setMsg("");
        try {
            await resendVerify(email);
            setMsg("If this email exists, we have re-sent a verification email. Please check your inbox.");
        } catch (e: any) {
            setMsg(e?.message || "Failed to send email. Please try again later.");
        }
    });

    return (
        <main className="max-w-md mx-auto p-6">
            <h1 className="text-xl font-semibold mb-4">Resend verification email</h1>
            <form onSubmit={onSubmit} className="space-y-3 card p-4">
                <div>
                    <label className="block text-sm mb-1">Email</label>
                    <input
                        className="input text-sm"
                        placeholder="you@example.com"
                        {...register("email")}
                    />
                    {formState.errors.email && (
                        <p className="text-xs text-red-600 mt-1">
                            {formState.errors.email.message}
                        </p>
                    )}
                </div>

                {msg && <div className="text-sm text-gray-700">{msg}</div>}

                <div className="flex gap-3">
                    <button
                        className="btn btn-primary text-sm"
                        disabled={formState.isSubmitting}
                    >
                        {formState.isSubmitting ? "Sending..." : "Send email"}
                    </button>
                    <button
                        type="button"
                        onClick={() => nav("/")}
                        className="btn btn-secondary text-sm"
                    >
                        Back to home
                    </button>
                </div>
            </form>
        </main>
    );
}
