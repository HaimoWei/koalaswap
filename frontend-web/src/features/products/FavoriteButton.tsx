import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/auth";
import { useUiStore } from "../../store/ui";
import { addFavorite, removeFavorite, checkFavorite } from "../../api/products";

export function FavoriteButton({ productId }: { productId: string }) {
    const token = useAuthStore((s) => s.token);
    const openAuth = useUiStore((s) => s.openAuth);
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
        if (!token) return openAuth();
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
            className={`px-4 py-2 rounded border text-sm ${fav ? "bg-yellow-50 border-yellow-400 text-yellow-700" : "bg-white border-gray-300"}`}
        >
            {loading ? "…" : fav ? "已收藏" : "收藏"}
        </button>
    );
}
