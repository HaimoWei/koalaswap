import { useSearchParams, Link } from "react-router-dom";

export default function PayResultPage() {
    const [sp] = useSearchParams();
    const orderId = sp.get("orderId") || "";
    const result = (sp.get("result") || "success").toLowerCase(); // success | fail

    const isSuccess = result === "success";

    return (
        <main className="max-w-4xl mx-auto p-6">
            <div className="card p-8 text-center">
                {/* 状态图标 */}
                <div className="mb-4">
                    {isSuccess ? (
                        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    ) : (
                        <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    )}
                </div>
                <div className="text-2xl font-semibold mb-2">{isSuccess ? "支付成功" : "待支付"}</div>
                <div className="text-sm text-gray-600 mb-6">
                    {isSuccess
                        ? "订单已成功支付，您可以在订单详情中查看物流信息和交易状态。"
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
                                to={`/orders/${orderId}`}
                                className="btn btn-primary text-sm"
                            >
                                查看订单详情
                            </Link>
                            <Link to="/" className="btn btn-secondary text-sm">
                                回首页
                            </Link>
                        </>
                    ) : (
                        <>
                            {orderId && (
                                <Link
                                    to={`/pay/${orderId}`}
                                    className="btn btn-primary text-sm"
                                >
                                    去支付
                                </Link>
                            )}
                            <Link to="/" className="btn btn-secondary text-sm">
                                回首页
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}
