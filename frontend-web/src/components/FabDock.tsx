import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { Icon } from "./Icon";

export default function FabDock() {
    const nav = useNavigate();
    const loc = useLocation();
    const token = useAuthStore((s) => s.token);

    const next = encodeURIComponent(`${loc.pathname}${loc.search || ""}`);
    const goLogin = () => nav(`/login?next=${next}`);

    return (
        <div className="fixed right-4 sm:right-6 bottom-24 z-[999] flex flex-col items-center gap-3" aria-label="快捷操作">
            <button
                className="w-14 h-14 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-2)] hover:brightness-105 active:brightness-95 flex items-center justify-center"
                onClick={() => (token ? nav("/publish") : goLogin())}
                aria-label="发闲置"
                title="发闲置"
            >
                <Icon name="plus" />
            </button>
            <span className="text-xs text-gray-700">发布</span>
            <button
                className="w-14 h-14 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-2)] hover:brightness-105 active:brightness-95 flex items-center justify-center"
                onClick={() => (token ? nav("/chat") : goLogin())}
                aria-label="消息"
                title="消息"
            >
                <Icon name="chat" />
            </button>
            <span className="text-xs text-gray-700">消息</span>
            <button
                className="w-14 h-14 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-2)] hover:brightness-105 active:brightness-95 flex items-center justify-center"
                onClick={() => nav("/support")}
                aria-label="客服"
                title="客服"
            >
                <Icon name="support" />
            </button>
            <span className="text-xs text-gray-700">客服</span>
        </div>
    );
}
