import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getOrder, payOrder } from "../api/orders";

export function OrderPayPage() {
    const { id = "" } = useParams<{ id: string }>();
    const nav = useNavigate();

    const q = useQuery({
        queryKey: ["orderPay", id],
        queryFn: () => getOrder(id),
        enabled: !!id,
    });

    async function onSuccess() {
        try {
            await payOrder(id);
        } catch (e: any) {
            alert(e?.message || "模拟支付失败（接口报错）");
            // 即使失败也跳详情看状态
        } finally {
            nav(`/orders/${id}`);
        }
    }

    function onFail() {
        // 不调用支付接口，直接去订单详情，状态保持 CREATED/PENDING
        nav(`/orders/${id}`);
    }

    if (q.isLoading) {
        return <main className="max-w-3xl mx-auto p-6">加载订单信息…</main>;
    }

    const o = q.data;

    return (
        <main className="max-w-3xl mx-auto p-6">
            <h1 className="text-xl font-semibold mb-4">模拟支付</h1>

            {o ? (
                <div className="bg-white border rounded-xl p-4 mb-4">
                    <div className="text-sm text-gray-600">订单号</div>
                    <div className="mb-2">{o.id}</div>
                    <div className="text-sm text-gray-600">应付金额</div>
                    <div className="font-semibold">¥{o.priceSnapshot}</div>
                </div>
            ) : (
                <div className="text-sm text-gray-600 mb-4">订单信息不可用</div>
            )}

            <div className="flex gap-3">
                <button
                    onClick={onSuccess}
                    className="px-4 py-2 rounded bg-black text-white"
                >
                    模拟支付成功
                </button>
                <button
                    onClick={onFail}
                    className="px-4 py-2 rounded bg-gray-200"
                >
                    模拟支付失败
                </button>
            </div>
        </main>
    );
}
