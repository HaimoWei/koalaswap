import { useAuthStore } from "../store/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { logout } from "../api/auth";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { listConversations } from "../api/chat";
import { Icon } from "./Icon";

// TopNav现在保持简洁统一的设计

export function TopNav({
    showSearch = true,
    showPublish = false,
    showMessages = false,
}: {
    showSearch?: boolean;
    showPublish?: boolean;
    showMessages?: boolean;
}) {
    const { token, profile, clear } = useAuthStore();
    const nav = useNavigate();
    const loc = useLocation();
    const [q, setQ] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // 移除返回按钮和页面标题逻辑，统一显示KoalaSwap

    useEffect(() => {
        const sp = new URLSearchParams(loc.search);
        setQ(loc.pathname === "/search" ? sp.get("q") || "" : "");
    }, [loc]);

    async function onLogout() {
        try { await logout(); } catch {}
        clear();
        nav("/"); // ★ 退出后回首页，触发首页数据重拉
    }

    function onSubmitSearch() {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        nav(`/search?${params.toString()}`);
    }

    // 未读消息统计（轻量轮询）
    const convQ = useQuery({
        queryKey: ["conversations", "header"],
        queryFn: () => listConversations({ page: 0, size: 30, aggregate: true }),
        refetchInterval: 15000,
        enabled: !!token,
    });
    const unread = (convQ.data?.content || []).reduce((s, c) => s + (c.unread || 0), 0);

    useEffect(() => {
        function onDoc(e: MouseEvent) {
            if (!menuRef.current) return;
            if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
        }
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    return (
        <header className="sticky top-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] z-20 shadow-[var(--shadow-1)]">
            <div className="page py-4 flex items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="font-bold text-lg cursor-pointer" onClick={() => nav("/")}>
                        KoalaSwap
                    </div>
                </div>
                {/* 居中搜索框（按需显示） */}
                <div className="flex-1 flex items-center justify-center">
                    {showSearch && (
                        <div className="w-full max-w-3xl flex gap-2">
                            <input
                                className="input flex-1"
                                placeholder="搜索全站（商品 / 关键词）"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && onSubmitSearch()}
                            />
                            <button className="btn btn-primary" onClick={onSubmitSearch} aria-label="搜索">
                                <Icon name="search" />
                            </button>
                        </div>
                    )}
                </div>
                {!token ? (
                    <div className="flex items-center gap-2">
                        <button onClick={() => nav(`/login?next=${encodeURIComponent(loc.pathname + (loc.search || ""))}`)} className="btn btn-primary">
                            登录
                        </button>
                        <button onClick={() => nav(`/register?next=${encodeURIComponent(loc.pathname + (loc.search || ""))}`)} className="btn btn-secondary">
                            注册
                        </button>
                    </div>

                ) : (
                    <div className="flex items-center gap-3">
                        {/* 发布（按需） */}
                        {showPublish && (
                            <button className="btn btn-primary" onClick={() => nav("/publish")}>发布</button>
                        )}
                        {/* 消息（按需） */}
                        {showMessages && (
                            <button className="relative btn btn-secondary" onClick={() => nav("/chat")} aria-label="我的消息">
                                <Icon name="bell" />
                                {unread > 0 && (
                                    <span className="absolute -top-1 -right-1 text-[10px] min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white flex items-center justify-center">
                                        {unread > 99 ? "99+" : unread}
                                    </span>
                                )}
                            </button>
                        )}
                        {/* 头像 + 菜单 */}
                        <div className="relative" ref={menuRef}>
                            <div
                                className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors cursor-pointer"
                                onMouseEnter={() => setMenuOpen(true)}
                                onMouseLeave={() => setMenuOpen(false)}
                            >
                                <img src={profile?.avatarUrl || "https://placehold.co/28x28"}
                                     className="w-8 h-8 rounded-full border border-[var(--color-border)]"/>
                                <span className="text-sm">{profile?.displayName || "我"}</span>
                                <svg className={`w-4 h-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                            {menuOpen && (
                                <div
                                    className="absolute right-0 top-full w-56 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-[var(--shadow-2)] py-1 z-50"
                                    onMouseEnter={() => setMenuOpen(true)}
                                    onMouseLeave={() => setMenuOpen(false)}
                                >
                                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-muted)]" onClick={() => { setMenuOpen(false); nav("/me/center/listings"); }}>我发布的</button>
                                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-muted)]" onClick={() => { setMenuOpen(false); nav("/me/center/orders?role=seller"); }}>我卖出的</button>
                                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-muted)]" onClick={() => { setMenuOpen(false); nav("/me/center/orders?role=buyer"); }}>我买到的</button>
                                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-muted)]" onClick={() => { setMenuOpen(false); nav("/me/center/favorites"); }}>我的收藏</button>
                                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-muted)]" onClick={() => { setMenuOpen(false); nav("/me/center/reviews?tab=commented"); }}>我的评价</button>
                                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-muted)]" onClick={() => { setMenuOpen(false); nav("/me/center/profile"); }}>账户管理</button>
                                    <div className="my-1 h-px bg-[var(--color-border)]" />
                                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-muted)]" onClick={() => { setMenuOpen(false); nav("/me/center"); }}>进入个人中心</button>
                                    <div className="my-1 h-px bg-[var(--color-border)]" />
                                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-muted)]" onClick={onLogout}>退出登录</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {/* 分类条移除（在首页 Hero 下方处理） */}
        </header>
    );
}
