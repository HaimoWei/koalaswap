import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getFavoritesCount } from "../api/favorites";

export function MeHomePage() {
    const favCountQ = useQuery({ queryKey: ["favCount"], queryFn: getFavoritesCount });

    return (
        <main className="space-y-4">
            {/* Quick shortcuts under profile header */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Link to="/me/center/listings" className="p-4 card hover:shadow-[var(--shadow-2)]">
                    My listings
                </Link>
                <Link to="/me/center/orders?role=buyer" className="p-4 card hover:shadow-[var(--shadow-2)]">
                    Orders I bought
                </Link>
                <Link to="/me/center/orders?role=seller" className="p-4 card hover:shadow-[var(--shadow-2)]">
                    Orders I sold
                </Link>
                <Link to="/me/center/favorites" className="p-4 card hover:shadow-[var(--shadow-2)]">
                    My favorites ({favCountQ.data ?? 0})
                </Link>
                <Link to="/me/center/reviews?tab=buyer" className="p-4 card hover:shadow-[var(--shadow-2)]">
                    To review
                </Link>
                <Link to="/me/center/reviews?tab=commented" className="p-4 card hover:shadow-[var(--shadow-2)]">
                    My reviews
                </Link>
            </div>
        </main>
    );
}
