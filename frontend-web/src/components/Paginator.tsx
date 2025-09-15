type Props = {
    page: number;              // 当前页 0-based
    totalPages: number;
    onPageChange: (p: number) => void;
};

// 简单分页器（上一页/下一页 + 页码）
export function Paginator({ page, totalPages, onPageChange }: Props) {
    if (totalPages <= 1) return null;

    const go = (p: number) => {
        if (p >= 0 && p < totalPages && p !== page) onPageChange(p);
    };
    const pages = getPageNumbers(page, totalPages);

    return (
        <div className="flex items-center justify-center gap-2 mt-6">
            <button
                className="btn btn-secondary text-sm"
                disabled={page <= 0}
                onClick={() => go(page - 1)}
            >
                上一页
            </button>

            {pages.map((p, i) =>
                p === -1 ? (
                    <span key={i} className="px-2">…</span>
                ) : (
                    <button
                        key={p}
                        onClick={() => go(p)}
                        className={`btn text-sm ${p === page ? "btn-primary" : "btn-secondary"}`}
                    >
                        {p + 1}
                    </button>
                )
            )}

            <button
                className="btn btn-secondary text-sm"
                disabled={page >= totalPages - 1}
                onClick={() => go(page + 1)}
            >
                下一页
            </button>
        </div>
    );
}

function getPageNumbers(cur: number, total: number) {
    // 生成有限页码数组（含省略号）
    const arr: number[] = [];
    const add = (x: number) => arr.push(x);
    // 显示头尾 + 当前左右
    for (let p = 0; p < total; p++) {
        if (p === 0 || p === total - 1 || Math.abs(p - cur) <= 2) add(p);
    }
    // 插入省略号
    const res: number[] = [];
    for (let i = 0; i < arr.length; i++) {
        res.push(arr[i]);
        if (i < arr.length - 1 && arr[i + 1] - arr[i] > 1) res.push(-1); // -1 代表 …
    }
    return res;
}
