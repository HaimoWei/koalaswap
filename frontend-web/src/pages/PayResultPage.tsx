import { useSearchParams, Link } from "react-router-dom";

export default function PayResultPage() {
    const [sp] = useSearchParams();
    const orderId = sp.get("orderId") || "";
    const result = (sp.get("result") || "success").toLowerCase(); // success | fail

    const isSuccess = result === "success";

    return (
        <main className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-xl border p-8 text-center">
                <div className="text-2xl font-semibold mb-2">{isSuccess ? "支付成功" : "待支付"}</div>
                <div className="text-sm text-gray-600 mb-6">
                    {isSuccess
                        ? "部分订单暂不支持查看详情，如需查看订单请前往「我买到的」。"
                        : "订单为你锁定 30 分钟，超时有可能被抢拍。"}
                </div>

                {orderId && (
                    <div className="mb-6 text-gray-700">
                        <div className="text-sm">订单编号：</div>
                        <div className="text-base font-medium">{orderId}</div>
                    </div>
                )}

                <div className="flex items-center justify-center gap-3">
                    {isSuccess ? (
                        <>
                            <Link
                                to="/orders?role=buyer&status=PAID"
                                className="px-4 py-2 rounded bg-black text-white text-sm"
                            >
                                查看详情
                            </Link>
                            <Link to="/" className="px-4 py-2 rounded bg-gray-100 text-sm">
                                回首页
                            </Link>
                        </>
                    ) : (
                        <>
                            {orderId && (
                                <Link
                                    to={`/pay/${orderId}`}
                                    className="px-4 py-2 rounded bg-black text-white text-sm"
                                >
                                    去支付
                                </Link>
                            )}
                            <Link to="/" className="px-4 py-2 rounded bg-gray-100 text-sm">
                                回首页
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}
