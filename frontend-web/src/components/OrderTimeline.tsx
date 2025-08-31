import { OrderStatusTag } from "./OrderStatusTag";

// 简单时间线：根据 status 高亮节点（伪造节点时间，仅展示流转步骤）
export function OrderTimeline({ status }: { status: string }) {
    const up = (status || "").toUpperCase();
    const steps = ["CREATED", "PAID", "SHIPPED", "CONFIRMED"];
    const idx = Math.max(
        steps.findIndex((s) => s === up || (up === "NEW" && s === "CREATED")),
        up === "COMPLETED" ? steps.length - 1 : -1
    );

    return (
        <div className="flex items-center gap-3 flex-wrap">
            {steps.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${i <= idx ? "bg-green-600" : "bg-gray-300"}`}/>
                    <div className={`text-xs ${i <= idx ? "text-green-700" : "text-gray-500"}`}>{mapText(s)}</div>
                    {i < steps.length - 1 && <div className="w-8 h-[1px] bg-gray-300 mx-1" />}
                </div>
            ))}
            {(up === "CANCELLED" || up === "CANCELED") && (
                <div className="ml-2 text-xs text-gray-600 flex items-center gap-2">
                    <span>→</span><OrderStatusTag status={status} />
                </div>
            )}
        </div>
    );
}
function mapText(s: string) {
    const m: Record<string,string> = { CREATED: "已创建", PAID: "已支付", SHIPPED: "已发货", CONFIRMED: "已收货" };
    return m[s] || s;
}
