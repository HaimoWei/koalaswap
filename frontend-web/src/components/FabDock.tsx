import { useNavigate } from "react-router-dom";

export default function FabDock() {
    const nav = useNavigate();

    const btn =
        "w-12 h-12 rounded-full shadow flex items-center justify-center bg-white hover:bg-gray-50 border";

    return (
        <div
            className="fixed right-4 sm:right-6 bottom-24 z-[999] flex flex-col items-center gap-3"
            aria-label="快捷操作"
        >
            <button className={btn} onClick={() => nav("/publish")} aria-label="发闲置">
                发
            </button>
            <button className={btn} onClick={() => nav("/chat")} aria-label="消息">
                信
            </button>
            <button
                className={btn}
                onClick={() => nav("/support")}
                aria-label="客服"
                title="客服"
            >
                客
            </button>
        </div>
    );
}
