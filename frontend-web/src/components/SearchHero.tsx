import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";

const DEFAULT_TAGS = ["Phones", "Electronics", "Computers", "Clothing", "Sports", "Home", "Beauty", "Baby", "Skills", "Vouchers"];

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
                <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-text-strong)]">Discover trusted second-hand deals</h1>
                <p className="mt-2 text-sm text-gray-600">Safe, convenient, and easy to trade via chat.</p>

                <div className="mt-5 max-w-2xl mx-auto flex gap-2">
                    <input
                        className="input text-base md:text-lg flex-1"
                        placeholder="Search: iPhone 12 / Switch / graphics card..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && goSearch()}
                        aria-label="Search keywords"
                    />
                    <button className="btn btn-primary md:px-6 md:btn-lg" onClick={() => goSearch()} aria-label="Search">
                        Search
                    </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {DEFAULT_TAGS.map((t) => (
                        <button
                            key={t}
                            className="chip chip-secondary hover:brightness-95"
                            onClick={() => goSearch(t)}
                            aria-label={`Search ${t}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}

