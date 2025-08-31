import { useState } from "react";

// 评分星星（可读/可写）
export function RatingStars({
                                value = 5,
                                onChange,
                                readOnly = false,
                                size = 20,
                            }: {
    value?: number;
    onChange?: (v: number) => void;
    readOnly?: boolean;
    size?: number;
}) {
    const [hover, setHover] = useState<number | null>(null);
    const stars = [1,2,3,4,5];

    const current = hover ?? value;

    return (
        <div className="inline-flex items-center gap-1">
            {stars.map((s) => (
                <svg
                    key={s}
                    onMouseEnter={() => !readOnly && setHover(s)}
                    onMouseLeave={() => !readOnly && setHover(null)}
                    onClick={() => !readOnly && onChange?.(s)}
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    className={s <= (current || 0) ? "fill-yellow-400 stroke-yellow-400" : "fill-none stroke-gray-300"}
                >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.88L18.18 22 12 18.56 5.82 22 7 14.15 2 9.27l6.91-1.01L12 2z"/>
                </svg>
            ))}
        </div>
    );
}
