import { useAuthStore } from "../store/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { logout } from "../api/auth";
import { useState, useEffect } from "react";
import { useUiStore } from "../store/ui";

export function TopNav() {
    const { token, profile, clear } = useAuthStore();
    const openAuth = useUiStore((s) => s.openAuth);
    const nav = useNavigate();
    const loc = useLocation();
    const [q, setQ] = useState("");

    useEffect(() => {
        const sp = new URLSearchParams(loc.search);
        setQ(loc.pathname === "/search" ? sp.get("q") || "" : "");
    }, [loc]);

    async function onLogout() {
        try { await logout(); } catch {}
        clear();
    }

    function onSubmitSearch() {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        nav(`/search?${params.toString()}`);
    }

    return (
        <header className="sticky top-0 bg-white border-b border-gray-200 z-10">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
                <div className="font-bold text-lg cursor-pointer" onClick={() => nav("/")}>
                    KoalaSwap
                </div>
                <div className="flex-1">
                    <input
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring"
                        placeholder="搜索全站（商品 / 关键词）"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && onSubmitSearch()}
                    />
                </div>
                {!token ? (
                    <button onClick={openAuth} className="px-3 py-2 text-sm rounded-md bg-black text-white">
                        登录 / 注册
                    </button>

                ) : (
                    <div className="flex items-center gap-3">
                        <img src={profile?.avatarUrl || "https://placehold.co/28x28"}
                             className="w-7 h-7 rounded-full border"/>
                        <span className="text-sm">{profile?.displayName || "我"}</span>
                        <button onClick={() => nav("/me/listings")}
                                className="text-sm px-2 py-1 rounded hover:bg-gray-100">我发布的
                        </button>
                        <button
                            onClick={() => nav("/orders?role=buyer")}
                            className="text-sm px-2 py-1 rounded hover:bg-gray-100">订单
                        </button>
                        <button onClick={() => nav("/me")}
                                className="text-sm px-2 py-1 rounded hover:bg-gray-100">个人中心
                        </button>
                        <button onClick={() => nav("/me/favorites")}
                                className="text-sm px-2 py-1 rounded hover:bg-gray-100">收藏
                        </button>
                        <button onClick={() => nav("/me/reviews/pending")}
                                className="text-sm px-2 py-1 rounded hover:bg-gray-100">评价
                        </button>
                        <button onClick={onLogout}
                                className="text-sm px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">退出
                        </button>
                    </div>
                )}
            </div>
            <nav className="bg-gray-50 border-t border-gray-200">
                <div className="max-w-6xl mx-auto px-4 py-2 text-sm text-gray-600 flex flex-wrap gap-4">
                    {["手机", "数码", "电脑", "服饰", "箱包", "运动", "技能", "卡券", "潮玩", "母婴", "美妆", "个护", "家具", "家电", "家装"].map((c) => (
                        <span key={c} className="cursor-pointer hover:text-black">{c}</span>
                    ))}
                </div>
            </nav>
        </header>
    );
}
