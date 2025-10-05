import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";

export function ReviewSuccessPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (!orderId) {
      nav('/', { replace: true });
    }
  }, [orderId, nav]);

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-[var(--shadow-2)] p-8 text-center space-y-8">
          <div className="w-20 h-20 mx-auto flex items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-text-strong)]">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-strong)]">评价提交成功！</h1>
            <p className="text-sm text-gray-600 mt-3">感谢您的评价，您的反馈对其他买家非常有帮助。</p>
          </div>

          {orderId && (
            <div className="bg-[var(--color-primary-50)] border border-[var(--color-primary-300)] rounded-xl p-4 text-sm text-[var(--color-text)]">
              <div className="text-xs text-[var(--color-secondary-700)]">评价订单</div>
              <div className="font-mono mt-1">{orderId}</div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => nav('/me/center/reviews?tab=commented')}
              className="btn btn-primary w-full"
            >
              查看我的评价
            </button>
            <button
              onClick={() => nav('/')}
              className="btn btn-ghost w-full"
            >
              返回主页
            </button>
          </div>

          <p className="text-xs text-gray-500">
            您还可以在个人中心查看和管理所有评价记录。
          </p>
        </div>
      </div>
    </main>
  );
}
