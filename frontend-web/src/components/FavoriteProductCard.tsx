import type { ProductRes } from "../api/types";
import { ProductCard } from "./ProductCard";

interface FavoriteProductCardProps {
    product: ProductRes;
    onRemove: (productId: string) => void;
}

export function FavoriteProductCard({ product, onRemove }: FavoriteProductCardProps) {
    const inactive = product.status && product.status !== "ACTIVE";

    return (
        <div className="relative">
            <div className="hover:scale-[1.02] transition-all duration-300">
                <ProductCard p={product} />

                {inactive && (
                    <div className="absolute inset-0 z-10 rounded-xl bg-gradient-to-t from-white/90 via-white/60 to-transparent border border-[var(--color-border)] flex flex-col justify-center items-center text-center p-4 gap-2 text-[var(--color-text-strong)] pointer-events-none">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <svg className="w-5 h-5 text-[var(--color-secondary-700)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M4.93 4.93l14.14 14.14M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            商品已失效
                        </div>
                        <div className="text-xs text-gray-500">原商品可能已下架或售出</div>
                    </div>
                )}
            </div>

            <button
                onClick={() => onRemove(product.id)}
                className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 px-4 py-1 text-xs rounded-full btn btn-primary"
            >
                取消收藏
            </button>
        </div>
    );
}