// 订单状态显示为中文标签，并兼容不同拼写（如 CANCELED/CANCELLED）
export function OrderStatusTag({ status }: { status: string }) {
    const label = mapStatus(status);
    const cls = statusIn(status, ["CANCELLED", "CANCELED"]) ? "tag-neutral"
        : statusIn(status, ["PENDING", "CREATED", "NEW"]) ? "tag-warning"
        : statusIn(status, ["PAID"]) ? "tag-info"
        : statusIn(status, ["SHIPPED"]) ? "tag-info"
        : statusIn(status, ["CONFIRMED","COMPLETED"]) ? "tag-success" : "tag-neutral";

    return <span className={`tag ${cls}`}>{label}</span>;
}

function statusIn(s: string, arr: string[]) {
    return arr.includes((s || "").toUpperCase());
}
function mapStatus(s: string) {
    const up = (s || "").toUpperCase();
    const m: Record<string,string> = {
        PENDING: "Pending payment",
        CREATED: "Pending payment",
        NEW: "Pending payment",
        PAID: "Paid",
        SHIPPED: "Shipped",
        CONFIRMED: "Received",
        COMPLETED: "Completed",
        CANCELLED: "Cancelled",
        CANCELED: "Cancelled",
    };
    return m[up] || s || "-";
}
