import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getFavoritesCount } from "../api/favorites";

export function MeHomePage() {
    const favCountQ = useQuery({ queryKey: ["favCount"], queryFn: getFavoritesCount });

    return (
        <main className="space-y-4">
            {/* 快捷入口区（个人中心右侧头卡下方） */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Link to="/me/center/listings" className="p-4 card hover:shadow-[var(--shadow-2)]">
                    我发布的
                </Link>
                <Link to="/me/center/orders?role=buyer" className="p-4 card hover:shadow-[var(--shadow-2)]">
                    我买到的
                </Link>
                <Link to="/me/center/orders?role=seller" className="p-4 card hover:shadow-[var(--shadow-2)]">
                    我卖出的
                </Link>
                <Link to="/me/center/favorites" className="p-4 card hover:shadow-[var(--shadow-2)]">
                    我的收藏（{favCountQ.data ?? 0}）
                </Link>
                <Link to="/me/center/reviews?tab=buyer" className="p-4 card hover:shadow-[var(--shadow-2)]">
                    待评价
                </Link>
                <Link to="/me/center/reviews?tab=commented" className="p-4 card hover:shadow-[var(--shadow-2)]">
                    我的评价
                </Link>
            </div>
        </main>
    );
}
