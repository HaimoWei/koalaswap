import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPassword, validateResetToken } from "../../api/auth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUiStore } from "../../store/ui";

const schema = z
    .object({
        password: z.string().min(6, "至少 6 位密码"),
        confirm: z.string().min(6, "至少 6 位密码"),
    })
    .refine((d) => d.password === d.confirm, {
        path: ["confirm"],
        message: "两次输入不一致",
    });

export function ResetPasswordPage() {
    const nav = useNavigate();
    const closeAuth = useUiStore((s) => s.closeAuth);
    useEffect(() => { closeAuth(); }, [closeAuth]); // 进入页面自动关闭登录弹窗

    const [params] = useSearchParams();
    const token = params.get("token") || "";

    const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
    });

    const [msg, setMsg] = useState<string>("");
    const [valid, setValid] = useState<null | boolean>(null); // null=校验中

    // 预校验 token
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
            if (!token) throw new Error("链接缺少 token");
            await resetPassword(token, password);
            setMsg("密码已重置，请使用新密码登录。");
        } catch (e: any) {
            setMsg(e?.message || "重置失败，请稍后再试");
        }
    });

    if (valid === null) {
        return <main className="max-w-md mx-auto p-6 text-center">校验链接中...</main>;
    }

    if (valid === false) {
        return (
            <main className="max-w-md mx-auto p-6 text-center">
                <h1 className="text-xl font-semibold mb-2">链接不可用</h1>
                <p className="text-gray-600 mb-4">重置链接无效或已过期，请重新发起找回密码。</p>
                <button
                    onClick={() => nav("/auth/forgot")}
                    className="btn btn-primary"
                >
                    去找回密码
                </button>
            </main>
        );
    }

    return (
        <main className="max-w-md mx-auto p-6">
            <h1 className="text-xl font-semibold mb-4">设置新密码</h1>
            <form onSubmit={onSubmit} className="space-y-3 card p-4">
                <div>
                    <label className="block text-sm mb-1">新密码</label>
                    <input
                        type="password"
                        className="input text-sm"
                        placeholder="至少 6 位"
                        {...register("password")}
                    />
                    {formState.errors.password && (
                        <p className="text-xs text-red-600 mt-1">
                            {formState.errors.password.message}
                        </p>
                    )}
                </div>
                <div>
                    <label className="block text-sm mb-1">确认新密码</label>
                    <input
                        type="password"
                        className="input text-sm"
                        placeholder="再次输入"
                        {...register("confirm")}
                    />
                    {formState.errors.confirm && (
                        <p className="text-xs text-red-600 mt-1">
                            {formState.errors.confirm.message}
                        </p>
                    )}
                </div>

                {msg && <div className="text-sm text-gray-700">{msg}</div>}

                <div className="flex gap-3">
                    <button
                        className="btn btn-primary text-sm"
                        disabled={formState.isSubmitting}
                    >
                        {formState.isSubmitting ? "提交中..." : "确认重置"}
                    </button>
                    <button
                        type="button"
                        onClick={() => nav("/login")}
                        className="btn btn-secondary text-sm"
                    >
                        去登录
                    </button>
                </div>
            </form>
        </main>
    );
}
