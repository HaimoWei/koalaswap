// 订单状态显示为中文标签，并兼容不同拼写（如 CANCELED/CANCELLED）
export function OrderStatusTag({ status }: { status: string }) {
    const label = mapStatus(status);
    const cls =
        statusIn(status, ["CANCELLED", "CANCELED"])
            ? "bg-gray-100 text-gray-600"
            : statusIn(status, ["PENDING", "CREATED", "NEW"])   // ← 加上 PENDING
                ? "bg-yellow-50 text-yellow-700"
                : statusIn(status, ["PAID"])
                    ? "bg-blue-50 text-blue-700"
                    : statusIn(status, ["SHIPPED"])
                        ? "bg-purple-50 text-purple-700"
                        : statusIn(status, ["CONFIRMED","COMPLETED"])
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-700";

    return <span className={`text-xs px-2 py-0.5 rounded ${cls}`}>{label}</span>;
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
