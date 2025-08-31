import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { verifyEmail } from "../../api/auth";

// 处理邮箱验证链接：/auth/verify?token=xxx
export function VerifyEmailPage() {
    const [params] = useSearchParams();
    const token = params.get("token") || "";
    const [status, setStatus] = useState<"pending" | "ok" | "fail">("pending");
    const nav = useNavigate();

    useEffect(() => {
        async function run() {
            try {
                const ok = await verifyEmail(token);
                setStatus(ok ? "ok" : "fail");
            } catch {
                setStatus("fail");
            }
        }
        if (token) run();
    }, [token]);

    return (
        <main className="max-w-lg mx-auto p-6 text-center">
            {status === "pending" && <p>验证中...</p>}
            {status === "ok" && (
                <>
                    <h1 className="text-xl font-semibold mb-2">邮箱验证成功</h1>
                    <p className="text-gray-600">现在可以返回首页并登录。</p>
                    <button
                        onClick={() => nav("/")}
                        className="mt-4 px-4 py-2 rounded bg-black text-white"
                    >
                        返回首页
                    </button>
                </>
            )}
            {status === "fail" && (
                <>
                    <h1 className="text-xl font-semibold mb-2">验证失败</h1>
                    <p className="text-gray-600">链接已失效或 token 不正确。</p>
                    <button
                        onClick={() => nav("/")}
                        className="mt-4 px-4 py-2 rounded bg-gray-800 text-white"
                    >
                        返回首页
                    </button>
                </>
            )}
        </main>
    );
}
