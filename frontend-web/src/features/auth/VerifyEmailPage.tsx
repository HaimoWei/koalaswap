// src/features/auth/VerifyEmailPage.tsx
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { verifyEmail } from "../../api/auth";

// 处理邮箱验证链接：/auth/verify?token=xxx（/verified 也可复用本页）
export function VerifyEmailPage() {
    const [params] = useSearchParams();
    const token = params.get("token") || "";
    const [status, setStatus] = useState<"pending" | "ok" | "fail">("pending");
    const [msg, setMsg] = useState<string>("");
    const nav = useNavigate();

    // ★ 防止开发环境 StrictMode 导致的二次验证
    const firedRef = useRef(false);

    useEffect(() => {
        async function run() {
            if (firedRef.current) return; // 已执行过就不再发请求
            firedRef.current = true;

            if (!token) {
                setMsg("缺少 token 参数");
                setStatus("fail");
                return;
            }

            try {
                await verifyEmail(token); // GET /api/auth/verify?token=...
                setStatus("ok");
            } catch (e: any) {
                // ★ 兜底：如果后端提示“已被使用”，当作已完成验证
                const text = e?.message || "";
                const used =
                    text.includes("已被使用") ||
                    text.toLowerCase().includes("used"); // 中英都兜底
                if (used) {
                    setStatus("ok");
                    return;
                }
                setMsg(text || "验证失败");
                setStatus("fail");
            }
        }
        run();
    }, [token]);

    return (
        <main className="max-w-lg mx-auto p-6 text-center">
            {status === "pending" && <p>验证中...</p>}

            {status === "ok" && (
                <>
                    <h1 className="text-xl font-semibold mb-2">邮箱验证成功</h1>
                    <p className="text-gray-600">现在可以使用该账号登录。</p>
                    <div className="mt-4 flex justify-center gap-3">
                        <button onClick={() => nav("/")} className="btn btn-primary">
                            返回首页
                        </button>
                        <button onClick={() => nav("/login")} className="btn btn-secondary">
                            去登录
                        </button>
                    </div>
                </>
            )}

            {status === "fail" && (
                <>
                    <h1 className="text-xl font-semibold mb-2">验证失败</h1>
                    <p className="text-gray-600">{msg || "链接已失效或 token 不正确。"}</p>
                    <button
                        onClick={() => nav("/")}
                        className="mt-4 btn btn-secondary"
                    >
                        返回首页
                    </button>
                </>
            )}
        </main>
    );
}
