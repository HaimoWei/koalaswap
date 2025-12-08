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
                setMsg("Missing token parameter.");
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
                    text.toLowerCase().includes("used"); // handle both Chinese and English backend messages
                if (used) {
                    setStatus("ok");
                    return;
                }
                setMsg(text || "Verification failed.");
                setStatus("fail");
            }
        }
        run();
    }, [token]);

    return (
        <main className="max-w-lg mx-auto p-6 text-center">
            {status === "pending" && <p>Verifying...</p>}

            {status === "ok" && (
                <>
                    <h1 className="text-xl font-semibold mb-2">Email verification successful</h1>
                    <p className="text-gray-600">You can now sign in with this account.</p>
                    <div className="mt-4 flex justify-center gap-3">
                        <button onClick={() => nav("/")} className="btn btn-primary">
                            Back to home
                        </button>
                        <button onClick={() => nav("/login")} className="btn btn-secondary">
                            Sign in
                        </button>
                    </div>
                </>
            )}

            {status === "fail" && (
                <>
                    <h1 className="text-xl font-semibold mb-2">Verification failed</h1>
                    <p className="text-gray-600">{msg || "The link has expired or the token is invalid."}</p>
                    <button
                        onClick={() => nav("/")}
                        className="mt-4 btn btn-secondary"
                    >
                        Back to home
                    </button>
                </>
            )}
        </main>
    );
}
