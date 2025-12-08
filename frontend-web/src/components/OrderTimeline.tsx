// Simple timeline: highlight nodes based on status
export function OrderTimeline({ status }: { status: string }) {
    const up = (status || "").toUpperCase();
    const steps = ["PENDING", "PAID", "SHIPPED", "CONFIRMED"]; // start from PENDING
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
                <div className="ml-2 text-xs text-gray-600">→ Cancelled</div>
            )}
        </div>
    );
}
function mapText(s: string) {
    const m: Record<string,string> = {
        PENDING: "Pending payment",
        PAID: "Paid",
        SHIPPED: "Shipped",
        CONFIRMED: "Received",
    };
    return m[s] || s;
}
