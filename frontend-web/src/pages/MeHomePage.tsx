import { Link } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { useQuery } from "@tanstack/react-query";
import { getFavoritesCount } from "../api/favorites";

export function MeHomePage() {
    const profile = useAuthStore((s) => s.profile);
    const favCountQ = useQuery({ queryKey: ["favCount"], queryFn: getFavoritesCount });

    return (
        <main className="max-w-6xl mx-auto p-6 space-y-4">
            <div className="bg-white border rounded-lg p-4 flex items-center gap-4">
                <img src={profile?.avatarUrl || "https://placehold.co/60x60"} className="w-14 h-14 rounded-full border" />
                <div className="flex-1">
                    <div className="text-lg font-semibold">{profile?.displayName || "我"}</div>
                    <div className="text-sm text-gray-600">{profile?.id}</div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Link to="/me/listings" className="p-4 bg-white border rounded-lg hover:bg-gray-50">
                    我发布的
                </Link>
                <Link to="/orders?role=buyer" className="p-4 bg-white border rounded-lg hover:bg-gray-50">
                    我买到的
                </Link>
                <Link to="/orders?role=seller" className="p-4 bg-white border rounded-lg hover:bg-gray-50">
                    我卖出的
                </Link>
                <Link to="/me/favorites" className="p-4 bg-white border rounded-lg hover:bg-gray-50">
                    我的收藏（{favCountQ.data ?? 0}）
                </Link>
                <Link to="/me/reviews/pending" className="p-4 bg-white border rounded-lg hover:bg-gray-50">
                    待评价
                </Link>
                <Link to="/me/reviews" className="p-4 bg-white border rounded-lg hover:bg-gray-50">
                    我写过的评价
                </Link>
            </div>
        </main>
    );
}
