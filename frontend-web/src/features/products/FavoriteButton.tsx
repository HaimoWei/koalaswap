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
                const ok = await checkFavorite(productId);
                if (mounted) setFav(ok);
            } catch {
                // 未登录或接口异常都不崩
            } finally {
                if (mounted) setLoading(false);
            }
        }
        run();
        return () => { mounted = false; };
    }, [productId]);

    async function toggle() {
        if (!token) {
            openAuth(); // 未登录直接拉登录弹窗
            return;
        }
        try {
            setLoading(true);
            if (!fav) {
                await addFavorite(productId);
                setFav(true);
            } else {
                await removeFavorite(productId);
                setFav(false);
            }
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
