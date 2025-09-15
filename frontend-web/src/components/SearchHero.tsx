import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";

const DEFAULT_TAGS = ["手机", "数码", "电脑", "服饰", "运动", "家居", "美妆", "母婴", "技能", "卡券"];

export function SearchHero({ preset }: { preset?: string }) {
    const nav = useNavigate();
    const loc = useLocation();
    const [sp] = useSearchParams();
    const [q, setQ] = useState(preset || sp.get("q") || "");

    useEffect(() => {
        setQ(preset || sp.get("q") || "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loc.search, preset]);

    function goSearch(keyword?: string) {
        const params = new URLSearchParams();
        const val = (keyword ?? q).trim();
        if (val) params.set("q", val);
        nav(`/search?${params.toString()}`);
    }

    return (
        <section className="mb-6">
            <div className="card p-6 md:p-10 text-center">
                <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-text-strong)]">发现靠谱的二手好物</h1>
                <p className="mt-2 text-sm text-gray-600">安全省心，聊一聊即可交易</p>

                <div className="mt-5 max-w-2xl mx-auto flex gap-2">
                    <input
                        className="input text-base md:text-lg flex-1"
                        placeholder="搜一搜：iPhone 12 / Switch / 显卡..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && goSearch()}
                        aria-label="搜索关键词"
                    />
                    <button className="btn btn-primary md:px-6 md:btn-lg" onClick={() => goSearch()} aria-label="搜索">
                        搜索
                    </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {DEFAULT_TAGS.map((t) => (
                        <button
                            key={t}
                            className="chip chip-secondary hover:brightness-95"
                            onClick={() => goSearch(t)}
                            aria-label={`搜索 ${t}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}

