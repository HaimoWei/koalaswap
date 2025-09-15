import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { addFavorite, removeFavorite, checkFavorite } from "../../api/products";

export function FavoriteButton({ productId }: { productId: string }) {
    const token = useAuthStore((s) => s.token);
    const nav = useNavigate();
    const loc = useLocation();
    const [loading, setLoading] = useState(true);
    const [fav, setFav] = useState<boolean>(false);

    useEffect(() => {
        let mounted = true;
        async function run() {
            try {
                if (!token) { setFav(false); return; } // ★ 未登录默认未收藏
                const ok = await checkFavorite(productId);
                if (mounted) setFav(!!ok);
            } catch {
                if (mounted) setFav(false);           // ★ 异常按未收藏
            } finally {
                if (mounted) setLoading(false);
            }
        }
        run();
        return () => { mounted = false; };
    }, [productId, token]); // ★ 对登录态敏感

    async function toggle() {
        if (!token) {
            const next = encodeURIComponent(`${loc.pathname}${loc.search || ""}`);
            nav(`/login?next=${next}`);
            return;
        }
        setLoading(true);
        try {
            if (!fav) {
                await addFavorite(productId);
                setFav(true);
            } else {
                await removeFavorite(productId);
                setFav(false);
            }
        } catch (e: any) {
            alert(e?.message || "收藏操作失败");
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={toggle}
            disabled={loading}
            className={`btn text-sm ${fav ? "btn-secondary" : "btn-secondary"}`}
        >
            {loading ? "…" : fav ? "已收藏" : "收藏"}
        </button>
    );
}
