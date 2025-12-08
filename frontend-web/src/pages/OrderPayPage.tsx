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
            await payOrder(id); // Payment succeeded
            nav(`/pay/result?orderId=${id}&result=success`);
        } catch (e: any) {
            // If API fails, also treat as failure
            nav(`/pay/result?orderId=${id}&result=fail`);
        }
    }

    function onFail() {
        // Do not call payment API, keep status as PENDING
        nav(`/pay/result?orderId=${id}&result=fail`);
    }

    if (q.isLoading) return <main className="max-w-3xl mx-auto p-6">Loading order information…</main>;

    const o = q.data;

    return (
        <main className="max-w-3xl mx-auto p-6">
            <h1 className="text-xl font-semibold mb-4">Mock payment</h1>

            {o ? (
                <div className="card p-4 mb-4">
                    <div className="text-sm text-gray-600">Order ID</div>
                    <div className="mb-2">{o.id}</div>
                    <div className="text-sm text-gray-600">Amount due</div>
                    <div className="font-semibold">¥{o.priceSnapshot}</div>
                </div>
            ) : (
                <div className="text-sm text-gray-600 mb-4">Order information is not available.</div>
            )}

            <div className="flex gap-3">
                <button onClick={onSuccess} className="btn btn-primary">Mock payment success</button>
                <button onClick={onFail} className="btn btn-secondary">Mock payment failure</button>
            </div>
        </main>
    );
}
