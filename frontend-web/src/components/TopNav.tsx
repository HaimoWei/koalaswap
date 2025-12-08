import { useAuthStore } from "../store/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { logout } from "../api/auth";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { listConversations } from "../api/chat";
import { Icon } from "./Icon";

// TopNav keeps a clean, unified design

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

    // Remove back button and page title; always show KoalaSwap

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

    // Unread messages count (light polling)
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
                {/* Centered search box (optional) */}
                <div className="flex-1 flex items-center justify-center">
                    {showSearch && (
                        <div className="w-full max-w-3xl flex gap-2">
                            <input
                                className="input flex-1"
                                placeholder="Search items or keywords"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && onSubmitSearch()}
                            />
                            <button className="btn btn-primary" onClick={onSubmitSearch} aria-label="Search">
                                <Icon name="search" />
                            </button>
                        </div>
                    )}
                </div>
                {!token ? (
                    <div className="flex items-center gap-2">
                        <button onClick={() => nav(`/login?next=${encodeURIComponent(loc.pathname + (loc.search || ""))}`)} className="btn btn-primary">
                            Sign in
                        </button>
                        <button onClick={() => nav(`/register?next=${encodeURIComponent(loc.pathname + (loc.search || ""))}`)} className="btn btn-secondary">
                            Register
                        </button>
                    </div>

                ) : (
                    <div className="flex items-center gap-3">
                        {/* 发布（按需） */}
                        {/* Publish (optional) */}
                        {showPublish && (
                            <a
                                href="/publish"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary"
                            >
                                List an item
                            </a>
                        )}
                        {/* Messages (optional) */}
                        {showMessages && (
                            <a
                                className="relative btn btn-secondary"
                                href="/chat"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="My messages"
                            >
                                <Icon name="bell" />
                                {unread > 0 && (
                                    <span className="absolute -top-1 -right-1 text-[10px] min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white flex items-center justify-center">
                                        {unread > 99 ? "99+" : unread}
                                    </span>
                                )}
                            </a>
                        )}
                        {/* Avatar + menu */}
                        <div className="relative" ref={menuRef}>
                            <div
                                className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors cursor-pointer"
                                onMouseEnter={() => setMenuOpen(true)}
                                onMouseLeave={() => setMenuOpen(false)}
                            >
                                <img src={profile?.avatarUrl || "https://placehold.co/28x28"}
                                    className="w-8 h-8 rounded-full border border-[var(--color-border)]"/>
                                <span className="text-sm">{profile?.displayName || "Me"}</span>
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
                                    <a className="block px-4 py-2 text-sm hover:bg-[var(--color-muted)]" href="/me/center/listings" target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}>My listings</a>
                                    <a className="block px-4 py-2 text-sm hover:bg-[var(--color-muted)]" href="/me/center/orders?role=seller" target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}>Orders I sold</a>
                                    <a className="block px-4 py-2 text-sm hover:bg-[var(--color-muted)]" href="/me/center/orders?role=buyer" target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}>Orders I bought</a>
                                    <a className="block px-4 py-2 text-sm hover:bg-[var(--color-muted)]" href="/me/center/favorites" target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}>My favorites</a>
                                    <a className="block px-4 py-2 text-sm hover:bg-[var(--color-muted)]" href="/me/center/reviews?tab=commented" target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}>My reviews</a>
                                    <a className="block px-4 py-2 text-sm hover:bg-[var(--color-muted)]" href="/me/center/profile" target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}>Account settings</a>
                                    <div className="my-1 h-px bg-[var(--color-border)]" />
                                    <a className="block px-4 py-2 text-sm hover:bg-[var(--color-muted)]" href="/me/center" target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}>Go to my center</a>
                                    <div className="my-1 h-px bg-[var(--color-border)]" />
                                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-muted)]" onClick={onLogout}>Sign out</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {/* Category bar removed (handled under home hero) */}
        </header>
    );
}
