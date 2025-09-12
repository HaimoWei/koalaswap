// 简单时间线：根据 status 高亮节点
export function OrderTimeline({ status }: { status: string }) {
    const up = (status || "").toUpperCase();
    const steps = ["PENDING", "PAID", "SHIPPED", "CONFIRMED"]; // ← 用 PENDING 起步
    const idx = Math.max(
        steps.findIndex((s) => s === up || (up === "CREATED" && s === "PENDING") || (up === "NEW" && s === "PENDING")),
        up === "COMPLETED" ? steps.length - 1 : -1
    );

    return (
        <div className="flex items-center gap-3 flex-wrap">
            {steps.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${i <= idx ? "bg-[var(--success)]" : "bg-gray-300"}`}/>
                    <div className={`text-xs ${i <= idx ? "text-[var(--success)]" : "text-gray-500"}`}>{mapText(s)}</div>
                    {i < steps.length - 1 && <div className="w-8 h-[1px] bg-[var(--color-border)] mx-1" />}
                </div>
            ))}
            {(up === "CANCELLED" || up === "CANCELED") && (
                <div className="ml-2 text-xs text-gray-600">→ 已取消</div>
            )}
        </div>
    );
}
function mapText(s: string) {
    const m: Record<string,string> = { PENDING: "待支付", PAID: "已支付", SHIPPED: "已发货", CONFIRMED: "已收货" };
    return m[s] || s;
}
