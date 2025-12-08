type Props = {
    page: number;              // current page 0-based
    totalPages: number;
    onPageChange: (p: number) => void;
};

// Simple paginator (previous/next + page numbers)
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
                Previous
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
                Next
            </button>
        </div>
    );
}

function getPageNumbers(cur: number, total: number) {
    // Generate a limited page list (with ellipsis)
    const arr: number[] = [];
    const add = (x: number) => arr.push(x);
    // Always show first/last and neighbors around current
    for (let p = 0; p < total; p++) {
        if (p === 0 || p === total - 1 || Math.abs(p - cur) <= 2) add(p);
    }
    // Insert ellipsis markers
    const res: number[] = [];
    for (let i = 0; i < arr.length; i++) {
        res.push(arr[i]);
        if (i < arr.length - 1 && arr[i + 1] - arr[i] > 1) res.push(-1); // -1 represents "…"
    }
    return res;
}
