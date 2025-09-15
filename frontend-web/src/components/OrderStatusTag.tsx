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
        PENDING: "待支付",          // ← 新增
        CREATED: "待支付",
        NEW: "待支付",
        PAID: "已支付",
        SHIPPED: "已发货",
        CONFIRMED: "已收货",
        COMPLETED: "已完成",
        CANCELLED: "已取消",
        CANCELED: "已取消",
    };
    return m[up] || s || "-";
}
