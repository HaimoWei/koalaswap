import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";

export function ReviewSuccessPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  // 如果没有orderId参数，可能是直接访问，重定向到首页
  useEffect(() => {
    if (!orderId) {
      nav('/', { replace: true });
    }
  }, [orderId, nav]);

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          {/* 成功图标 */}
          <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* 标题 */}
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            评价提交成功！
          </h1>

          {/* 描述 */}
          <p className="text-gray-600 mb-8">
            感谢您的评价，您的反馈对其他买家非常有帮助
          </p>

          {/* 订单信息 */}
          {orderId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-8 text-sm">
              <div className="text-gray-500">评价订单</div>
              <div className="font-mono text-gray-800">{orderId}</div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="space-y-3">
            <button
              onClick={() => nav('/me/center/reviews?tab=commented')}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              查看我的评价
            </button>

            <button
              onClick={() => nav('/')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium transition-colors"
            >
              返回主页
            </button>
          </div>

          {/* 额外信息 */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              您还可以在个人中心查看和管理所有评价记录
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}