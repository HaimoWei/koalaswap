import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { requestPasswordReset } from "../../api/auth";
import { useNavigate } from "react-router-dom";
import { useUiStore } from "../../store/ui";

const schema = z.object({
    email: z.string().email("请输入有效邮箱"),
});

export function ForgotPasswordPage() {
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
            await requestPasswordReset(email);
            // 后端无论邮箱是否存在都返回 200：统一提示
            setMsg("如果该邮箱存在，我们已发送重置密码邮件，请查收。");
        } catch (e: any) {
            setMsg(e?.message || "发送失败，请稍后再试");
        }
    });

    return (
        <main className="max-w-md mx-auto p-6">
            <h1 className="text-xl font-semibold mb-4">找回密码</h1>
            <form onSubmit={onSubmit} className="space-y-3 card p-4">
                <div>
                    <label className="block text-sm mb-1">注册邮箱</label>
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
                        {formState.isSubmitting ? "发送中..." : "发送重置邮件"}
                    </button>
                    <button
                        type="button"
                        onClick={() => nav("/")}
                        className="btn btn-secondary text-sm"
                    >
                        返回首页
                    </button>
                </div>
            </form>
        </main>
    );
}
